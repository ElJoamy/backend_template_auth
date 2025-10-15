import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { setupLogger } from './logger';
import { getAppSettings, getJwtSettings, type AppSettings, type JwtSettings } from '../config/settings';

const _APP_SETTINGS: AppSettings = getAppSettings();
const _JWT_SETTINGS: JwtSettings = getJwtSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(_JWT_SETTINGS.jwt_secret);
}

async function buildToken(data: Record<string, any>, expiresMinutes: number): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const payload = { ...data, jti };

  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: _JWT_SETTINGS.jwt_algorithm, typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + expiresMinutes * 60)
      .setIssuer(_JWT_SETTINGS.jwt_issuer)
      .setAudience(_JWT_SETTINGS.jwt_audience)
      .sign(getSecretKey());
    logger.debug('✅ JWT generated successfully');
    return token;
  } catch (e: any) {
    logger.error(`❌ Error generating JWT: ${e?.message ?? e}`);
    throw e;
  }
}

export async function createAccessToken(data: Record<string, any>): Promise<string> {
  return await buildToken(data, _JWT_SETTINGS.jwt_expiration_minutes);
}

export async function createRefreshToken(data: Record<string, any>): Promise<string> {
  return await buildToken(data, _JWT_SETTINGS.jwt_refresh_expiration_minutes);
}

export async function decodeToken(token: string): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: _JWT_SETTINGS.jwt_issuer,
      audience: _JWT_SETTINGS.jwt_audience,
      algorithms: [_JWT_SETTINGS.jwt_algorithm as any],
    });
    logger.debug('🔓 JWT decoded successfully');
    return payload as Record<string, any>;
  } catch (e: any) {
    logger.warn(`⚠️ Invalid or expired token: ${e?.message ?? e}`);
    return null;
  }
}