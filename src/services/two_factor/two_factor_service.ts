import speakeasy from 'speakeasy';
import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { ValidationError } from '../../utils/errors';
import { parseTwoFactorSetupRequest, type TwoFactorSetupRequest } from '../../schemas/two_factor/setup_request';
import { parseTwoFactorVerifyRequest, type TwoFactorVerifyRequest } from '../../schemas/two_factor/verify_request';
import type { TwoFactorSetupResponse, TwoFactorVerifyResponse, TwoFactorStatusResponse } from '../../schemas/two_factor/response';
import {
  getTwoFactorByUserId,
  createTwoFactorRecord,
  updateTwoFactorRecord,
  deleteTwoFactorRecord,
  enableTwoFactor,
  disableTwoFactor,
  type TwoFactorRecord
} from '../../repositories/two_factor/two_factor_repository';
import { getUserById } from '../../repositories/auth/common_repository';
import { hashPassword } from '../../utils/password_utils';
import { createRecoveryCodes, deleteAllRecoveryCodes } from '../../repositories/two_factor/recovery_codes_repository';
import { createAccessToken, decodeToken } from '../../utils/jwt';
import { createSession, revokeAllActiveSessionsByUserId } from '../../repositories/auth/session_repository';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

/**
 * Genera un secreto y configuración inicial para 2FA
 */
export async function setupTwoFactorService(
  userId: number,
  rawBody: any
): Promise<TwoFactorSetupResponse> {
  // Verificar que el usuario existe
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  // Parsear la solicitud (solo para validar formato, no usamos los campos)
  parseTwoFactorSetupRequest(rawBody);

  // Verificar si ya existe una configuración 2FA
  const existing = await getTwoFactorByUserId(userId);
  if (existing && existing.is_enabled) {
    throw new ValidationError('2FA ya está habilitado para este usuario.', 409);
  }

  // Usar siempre valores por defecto para issuer y label
  const finalIssuer = _APP_SETTINGS.service_name || 'SeagullAI Backend';
  const finalLabel = user.email; // Solo el email del usuario

  // Generar un nuevo secreto usando speakeasy
  const secret = speakeasy.generateSecret({
    length: 32,
    name: finalLabel,
    issuer: finalIssuer
  });

  // Guardar o actualizar el registro en la base de datos
  if (existing) {
    // Actualizar el registro existente
    const updated = await updateTwoFactorRecord(userId, {
      secret: secret.base32,
      issuer: finalIssuer,
      label: finalLabel,
      is_enabled: false,
      confirmed_at: null
    });
    
    if (!updated) {
      throw new ValidationError('Error al actualizar la configuración 2FA.', 500);
    }
  } else {
    // Crear un nuevo registro
    const created = await createTwoFactorRecord(
      userId,
      secret.base32,
      'sha1', // Algoritmo por defecto
      6,      // 6 dígitos
      30,     // 30 segundos de período
      finalIssuer,
      finalLabel
    );
    
    if (!created) {
      throw new ValidationError('Error al crear la configuración 2FA.', 500);
    }
  }

  logger.info(`2FA setup initiated for user ${userId}`);

  return {
    secret: secret.base32,
    qr_code_url: secret.otpauth_url || '',
    manual_entry_key: secret.base32,
    issuer: finalIssuer,
    label: finalLabel
  };
}

/**
 * Verifica un código TOTP y habilita 2FA si es correcto
 */
export async function verifyAndEnableTwoFactorService(
  userId: number,
  rawBody: any
): Promise<TwoFactorVerifyResponse> {
  // Verificar que el usuario existe
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  // Parsear la solicitud
  const { token } = parseTwoFactorVerifyRequest(rawBody);

  // Obtener la configuración 2FA
  const twoFactorRecord = await getTwoFactorByUserId(userId);
  if (!twoFactorRecord) {
    throw new ValidationError('No se encontró configuración 2FA para este usuario.', 404);
  }

  if (twoFactorRecord.is_enabled) {
    throw new ValidationError('2FA ya está habilitado para este usuario.', 409);
  }

  // Verificar el token usando speakeasy
  const verified = speakeasy.totp.verify({
    secret: twoFactorRecord.secret,
    encoding: 'base32',
    token: token,
    step: twoFactorRecord.period,
    digits: twoFactorRecord.digits,
    algorithm: twoFactorRecord.algorithm,
    window: 2 // Permitir una ventana de ±2 períodos (±60 segundos por defecto)
  });

  if (!verified) {
    logger.warn(`Invalid 2FA token attempt for user ${userId}`);
    return {
      success: false,
      message: 'Código de verificación inválido.'
    };
  }

  // Habilitar 2FA
  const enabled = await enableTwoFactor(userId);
  if (!enabled) {
    throw new ValidationError('Error al habilitar 2FA.', 500);
  }

  logger.info(`2FA successfully enabled for user ${userId}`);
  // Generar y almacenar códigos de recuperación (10 códigos, formateados XXXX-XXXX-XXXX)
  // Primero limpiar posibles códigos anteriores
  try { await deleteAllRecoveryCodes(userId); } catch (e) { /* noop */ }

  const codesPlain: string[] = [];
  const codesHash: string[] = [];
  function genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
  }
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    codesPlain.push(code);
  }
  for (const c of codesPlain) {
    const h = await hashPassword(c);
    codesHash.push(h);
  }
  await createRecoveryCodes(userId, codesHash);

  // Emitir nuevo token de acceso sin "two_factor_pending" para dar acceso completo
  const payload = {
    sub: String(user.id),
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role_name: user.role_name,
  };
  const fullAccessToken = await createAccessToken(payload);
  // Registrar sesión
  const decoded = await decodeToken(fullAccessToken);
  if (decoded?.jti && decoded?.exp) {
    const expiresAt = new Date((decoded.exp as number) * 1000);
    try { await createSession(user.id, decoded.jti as string, expiresAt); } catch { /* ignore */ }
    // Revocar cualquier otra sesión activa previa, excepto la recién creada
    try { await revokeAllActiveSessionsByUserId(user.id, String(decoded.jti)); } catch { /* ignore */ }
  }

  return {
    success: true,
    message: '2FA habilitado correctamente.',
    recovery_codes: codesPlain,
    access_token: fullAccessToken,
  };
}

/**
 * Verifica un código TOTP para un usuario que ya tiene 2FA habilitado
 */
export async function verifyTwoFactorTokenService(
  userId: number,
  token: string
): Promise<boolean> {
  // Obtener la configuración 2FA
  const twoFactorRecord = await getTwoFactorByUserId(userId);
  if (!twoFactorRecord || !twoFactorRecord.is_enabled) {
    return false;
  }

  // Verificar el token usando speakeasy
  const verified = speakeasy.totp.verify({
    secret: twoFactorRecord.secret,
    encoding: 'base32',
    token: token,
    step: twoFactorRecord.period,
    digits: twoFactorRecord.digits,
    algorithm: twoFactorRecord.algorithm,
    window: 2 // Permitir una ventana de ±2 períodos
  });

  if (verified) {
    logger.debug(`2FA token verified successfully for user ${userId}`);
  } else {
    logger.warn(`Invalid 2FA token for user ${userId}`);
  }

  return verified;
}

/**
 * Completa el login 2FA: verifica el TOTP y entrega un access token completo
 */
export async function completeTwoFactorLoginService(
  userId: number,
  twoFactorToken: string
): Promise<{ user_id: number; role_id: number | null; access_token: string }> {
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  const ok = await verifyTwoFactorTokenService(userId, twoFactorToken);
  if (!ok) {
    throw new ValidationError('Código de autenticación de dos factores inválido.', 400);
  }

  // Emitir nuevo token de acceso sin two_factor_pending para conceder acceso completo
  const payload = {
    sub: String(user.id),
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role_name: user.role_name,
  };
  const accessToken = await createAccessToken(payload);
  // Registrar sesión usando jti y exp del token
  const decoded = await decodeToken(accessToken);
  if (decoded?.jti && decoded?.exp) {
    const expiresAt = new Date((decoded.exp as number) * 1000);
    try { await createSession(user.id, decoded.jti as string, expiresAt); } catch { /* ignore */ }
    // Revocar cualquier otra sesión activa previa, excepto la recién creada
    try { await revokeAllActiveSessionsByUserId(user.id, String(decoded.jti)); } catch { /* ignore */ }
  }

  return {
    user_id: user.id,
    role_id: user.role_id ?? null,
    access_token: accessToken,
  };
}

/**
 * Obtiene el estado actual de 2FA para un usuario
 */
export async function getTwoFactorStatusService(userId: number): Promise<TwoFactorStatusResponse> {
  // Verificar que el usuario existe
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  // Obtener la configuración 2FA
  const twoFactorRecord = await getTwoFactorByUserId(userId);
  
  if (!twoFactorRecord) {
    return {
      is_enabled: false,
      confirmed_at: null,
      issuer: null,
      label: null
    };
  }

  return {
    is_enabled: twoFactorRecord.is_enabled,
    confirmed_at: twoFactorRecord.confirmed_at ? twoFactorRecord.confirmed_at.toISOString() : null,
    issuer: twoFactorRecord.issuer,
    label: twoFactorRecord.label
  };
}

/**
 * Deshabilita 2FA para un usuario (requiere verificación de token)
 */
export async function disableTwoFactorService(
  userId: number,
  rawBody: any
): Promise<TwoFactorVerifyResponse> {
  // Verificar que el usuario existe
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  // Parsear la solicitud
  const { token } = parseTwoFactorVerifyRequest(rawBody);

  // Obtener la configuración 2FA
  const twoFactorRecord = await getTwoFactorByUserId(userId);
  if (!twoFactorRecord || !twoFactorRecord.is_enabled) {
    throw new ValidationError('2FA no está habilitado para este usuario.', 404);
  }

  // Verificar el token antes de deshabilitar
  const verified = await verifyTwoFactorTokenService(userId, token);
  if (!verified) {
    return {
      success: false,
      message: 'Código de verificación inválido.'
    };
  }

  // Deshabilitar 2FA
  const disabled = await disableTwoFactor(userId);
  if (!disabled) {
    throw new ValidationError('Error al deshabilitar 2FA.', 500);
  }

  logger.info(`2FA disabled for user ${userId}`);

  return {
    success: true,
    message: '2FA deshabilitado correctamente.'
  };
}

/**
 * Elimina completamente la configuración 2FA de un usuario
 */
export async function removeTwoFactorService(
  userId: number,
  rawBody: any
): Promise<TwoFactorVerifyResponse> {
  // Verificar que el usuario existe
  const user = await getUserById(userId);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }

  // Parsear la solicitud
  const { token } = parseTwoFactorVerifyRequest(rawBody);

  // Obtener la configuración 2FA
  const twoFactorRecord = await getTwoFactorByUserId(userId);
  if (!twoFactorRecord) {
    throw new ValidationError('No se encontró configuración 2FA para este usuario.', 404);
  }

  // Si está habilitado, verificar el token antes de eliminar
  if (twoFactorRecord.is_enabled) {
    const verified = await verifyTwoFactorTokenService(userId, token);
    if (!verified) {
      return {
        success: false,
        message: 'Código de verificación inválido.'
      };
    }
  }

  // Eliminar la configuración 2FA
  const deleted = await deleteTwoFactorRecord(userId);
  if (!deleted) {
    throw new ValidationError('Error al eliminar la configuración 2FA.', 500);
  }

  logger.info(`2FA configuration removed for user ${userId}`);

  return {
    success: true,
    message: 'Configuración 2FA eliminada correctamente.'
  };
}