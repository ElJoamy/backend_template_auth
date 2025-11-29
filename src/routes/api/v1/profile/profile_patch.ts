import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { updateProfileService } from '../../../../services/profile/profile_service';
import { requireAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const patchProfileRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Actualizar perfil del usuario autenticado (PATCH)
 *     description: |
 *       Actualiza parcialmente: name, lastname, username, phone.
 *       Para el avatar, utiliza multipart/form-data con el campo `avatar`.
 *       El tipo de imagen se detecta automáticamente; si no es válido, se rechaza.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       '200':
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProfileResponse'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
patchProfileRouter.patch('/', requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const file = req.file
      ? { originalname: req.file.originalname, mimetype: req.file.mimetype, buffer: req.file.buffer, size: req.file.size }
      : undefined;
    const userId = Number((req as any).userId);
    const result = await updateProfileService(userId, req.body, file);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 400;
    const message = err?.message ?? 'Error al actualizar perfil';
    if (err instanceof ValidationError) {
      logger.warn(`Invalid profile patch: ${message}`);
    } else {
      logger.error(`Profile patch failed: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});