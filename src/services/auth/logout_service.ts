import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import type { LogoutResponse } from '../../schemas/auth/logout/response';
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
      logger.warn('Logout sin Authorization header.');
    } else {
      const payload = await decodeToken(token);
      if (payload) {
        logger.info(`Logout de usuario sub=${payload.sub ?? 'desconocido'}`);
        if (payload.jti) {
          await revokeSessionByJti(String(payload.jti));
        }
      } else {
        logger.warn('Logout con token inválido o expirado.');
      }
    }
    return { success: true };
  } catch (e: any) {
    logger.error(`Error en logout: ${e?.message ?? e}`);
    // Aun con error interno, no bloqueamos el logout; devolvemos success para cliente stateless
    return { success: true };
  }
}