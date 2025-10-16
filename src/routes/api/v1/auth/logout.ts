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
 *     summary: Logout
 *     description: |
 *       Revokes the active session associated with the **JWT** provided in the `Authorization: Bearer <token>` header.
 *       - Si la sesión ya estaba cerrada, devuelve **409 Conflict** con mensaje.
 *       - Requires Bearer authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       '409':
 *         description: La sesión ya estaba revocada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
logoutRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const result = await logoutService(req.headers.authorization);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? 'Error en logout';
    logger.error(`Logout failed: ${message}`);
    res.status(status).json({ error: message });
  }
});