import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import type { LogoutResponse } from '../../schemas/auth/logout/response';
import { AuthError } from '../../utils/errors';
import { decodeToken } from '../../utils/jwt';
import { revokeSessionByJti } from '../../repositories/auth/session_repository';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function logoutService(authHeader: string | undefined): Promise<LogoutResponse> {
  try {
    const token = (authHeader || '').startsWith('Bearer ')
      ? authHeader!.slice('Bearer '.length)
      : undefined;
    if (!token) {
      logger.warn('Logout without Authorization header.');
    } else {
      const payload = await decodeToken(token);
      if (payload) {
        logger.info(`User logout sub=${payload.sub ?? 'unknown'}`);
        if (payload.jti) {
          const revoked = await revokeSessionByJti(String(payload.jti));
          if (!revoked) {
            throw new AuthError('La sesión ya está cerrada.', 409);
          }
        }
      } else {
        logger.warn('Logout with invalid or expired token.');
      }
    }
    return { success: true };
  } catch (e: any) {
    logger.error(`Logout error: ${e?.message ?? e}`);
    throw e;
  }
}