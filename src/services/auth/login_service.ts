import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { AuthError, ValidationError } from '../../utils/errors';
import { parseLoginRequest, type LoginRequest } from '../../schemas/auth/login/request';
import type { LoginResponse } from '../../schemas/auth/login/response';
import { verifyPassword } from '../../utils/password_utils';
import { createAccessToken, decodeToken } from '../../utils/jwt';
import {
  getUserByEmail,
  getUserByUsername,
  type UserRecord,
} from '../../repositories/auth/login_repository';
import { getActiveSessionByUserId, createSession } from '../../repositories/auth/session_repository';
//

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

// Eliminado: la respuesta ya no incluye el objeto PublicUser

export async function loginService(rawBody: any): Promise<LoginResponse> {
  const input: LoginRequest = parseLoginRequest(rawBody);
  const user = input.email
    ? await getUserByEmail(input.email)
    : await getUserByUsername(input.username!);

  if (!user) {
    throw new AuthError('Credenciales inválidas.');
  }

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) {
    throw new AuthError('Credenciales inválidas.');
  }

  // Bloquear si ya existe una sesión activa para este usuario
  const active = await getActiveSessionByUserId(user.id);
  if (active) {
    throw new AuthError('Ya existe una sesión activa para este usuario.', 409);
  }

  logger.info(`Login exitoso: ${user.email}`);
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
    try {
      await createSession(user.id, decoded.jti as string, expiresAt);
    } catch (e: any) {
      logger.error(`No se pudo crear sesión: ${e?.message ?? e}`);
    }
  } else {
    logger.warn('Token sin jti/exp al crear sesión.');
  }
  return {
    user_id: user.id,
    role_id: user.role_id ?? null,
    access_token: accessToken,
  };
}