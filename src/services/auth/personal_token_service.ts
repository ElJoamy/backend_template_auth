import crypto from 'crypto';
import argon2 from 'argon2';
import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { ValidationError } from '../../utils/errors';
import { createPersonalToken, listActivePersonalTokensByUserId, revokePersonalTokenForUser } from '../../repositories/auth/personal_token_repository';
import { getUserById } from '../../repositories/auth/common_repository';
import { computeExpiresAtFromPreset, PersonalTokenExpiryPreset } from '../../schemas/personal_token';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function createPersonalTokenService(userId: number, name?: string | null, expiresPreset?: PersonalTokenExpiryPreset | null): Promise<{ token: string }> {
  const user = await getUserById(userId);
  if (!user) throw new ValidationError('Usuario no encontrado.', 404);

  // Generar token aleatorio seguro (32 bytes => ~43 caracteres base64url)
  const raw = crypto.randomBytes(32).toString('base64url');
  const tokenHash = await argon2.hash(raw);
  const expiresAt = computeExpiresAtFromPreset(expiresPreset ?? undefined);
  await createPersonalToken(userId, tokenHash, expiresAt, name ?? null, expiresPreset ?? null);
  logger.info(`Personal token issued for user ${userId}`);
  return { token: raw };
}



export async function listUserActiveTokensService(userId: number) {
  const tokens = await listActivePersonalTokensByUserId(userId);
  return tokens.map((t) => ({
    id: t.id,
    name: t.name,
    created_at: t.created_at,
    expires_at: t.expires_at,
  }));
}

export async function revokePersonalTokenService(userId: number, id: number): Promise<{ revoked: boolean }>{
  if (!Number.isFinite(id) || id <= 0) throw new ValidationError('ID inválido.', 400);
  const ok = await revokePersonalTokenForUser(id, userId);
  if (!ok) throw new ValidationError('Token no encontrado o no pertenece al usuario.', 404);
  return { revoked: true };
}