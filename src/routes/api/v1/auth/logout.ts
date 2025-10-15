import { Router, Request, Response } from 'express';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { logoutService } from '../../../../services/auth/logout_service';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const logoutRouter = Router();

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     description: |
 *       Revoca la sesión activa asociada al **JWT** suministrado en el header `Authorization: Bearer <token>`.
 *       - Idempotente: si el token es inválido o ya se cerró la sesión, devuelve `success: true`.
 *       - Requiere autenticación Bearer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
logoutRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const result = await logoutService(req.headers.authorization);
    res.status(200).json(result);
  } catch (err: any) {
    const message = err?.message ?? 'Error en logout';
    logger.error(`Fallo en logout: ${message}`);
    res.status(200).json({ success: true });
  }
});