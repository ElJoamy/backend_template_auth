import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { requireBearerAuth } from '../../../../middlewares/auth';
import { createPersonalTokenService, listUserActiveTokensService, revokePersonalTokenService } from '../../../../services/auth/personal_token_service';
import { ValidationError } from '../../../../utils/errors';
import { PERSONAL_TOKEN_EXPIRY_PRESETS } from '../../../../schemas/personal_token';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const personalTokenRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/auth/personal-token/create:
 *   post:
 *     tags: [Auth]
 *     summary: Crear token de acceso personal
 *     description: |
 *       Genera un token de acceso personal para el usuario autenticado.
 *       - Devuelve el token en texto claro una sola vez; no se vuelve a mostrar.
 *       - Requiere autenticación por Bearer.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PersonalTokenCreateRequest'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalTokenCreateRequest'
 *     responses:
 *       200:
 *         description: Token personal creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: No autorizado
 */
personalTokenRouter.post('/personal-token/create', requireBearerAuth, upload.none(), async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }
    const name = typeof req.body?.name === 'string' ? req.body.name : undefined;
    const expiresPresetRaw = typeof req.body?.expires_preset === 'string' ? req.body.expires_preset : undefined;
    const allowed = new Set(PERSONAL_TOKEN_EXPIRY_PRESETS as string[]);
    const expiresPreset = allowed.has(String(expiresPresetRaw)) ? (expiresPresetRaw as any) : undefined;
    const result = await createPersonalTokenService(userId, name, expiresPreset);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? 'Error creando token personal';
    if (status >= 500) logger.error(message); else logger.warn(message);
    res.status(status).json({ error: message });
  }
});

/**
 * @openapi
 * /api/v1/auth/personal-token/list:
 *   get:
 *     tags: [Auth]
 *     summary: Listar tus tokens personales activos
 *     description: |
 *       Devuelve los tokens personales activos del usuario autenticado.
 *       - Solo disponible con autenticación Bearer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tokens activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   name:
 *                     type: string
 *                     nullable: true
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   expires_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 */
personalTokenRouter.get('/personal-token/list', requireBearerAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }
    const tokens = await listUserActiveTokensService(userId);
    res.status(200).json(tokens);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? 'Error listando tokens personales';
    if (status >= 500) logger.error(message); else logger.warn(message);
    res.status(status).json({ error: message });
  }
});

/**
 * @openapi
 * /api/v1/auth/personal-token/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revocar token personal por ID
 *     description: |
 *       Revoca (invalida) un token personal del usuario autenticado.
 *       - Solo el propietario puede revocar su token.
 *       - Una vez revocado, el token no podrá usarse.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Token revocado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revoked:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Token no encontrado o no pertenece al usuario
 */
personalTokenRouter.delete('/personal-token/:id', requireBearerAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }
    const id = Number(req.params.id);
    const result = await revokePersonalTokenService(userId, id);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? 'Error revocando token personal';
    if (status >= 500) logger.error(message); else logger.warn(message);
    res.status(status).json({ error: message });
  }
});