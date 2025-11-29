import { Router, Request, Response } from 'express';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { getProfileService } from '../../../../services/profile/profile_service';
import { requireAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const getProfileRouter = Router();

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna datos del perfil del usuario autenticado, incluyendo avatar_type.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters: []
 *     responses:
 *       '200':
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetProfileResponse'
 *       '404':
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
getProfileRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).userId);
    const result = await getProfileService(userId);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? (err?.message?.includes('no encontrado') ? 404 : 500);
    const message = err?.message ?? 'Error al obtener perfil';
    if (err instanceof ValidationError) {
      logger.warn(`Invalid profile request: ${message}`);
    } else {
      logger.error(`Get profile failed: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});