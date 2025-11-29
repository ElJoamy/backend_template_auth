import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { requireBearerAuthAllowPending } from '../../../../middlewares/auth';
import { completeTwoFactorLoginService } from '../../../../services/two_factor/two_factor_service';
import { ValidationError } from '../../../../utils/errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const twoFactorLoginRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/auth/two-factor/login:
 *   post:
 *     tags: [Auth]
 *     summary: Completar login con 2FA (paso 2)
 *     description: |
 *       Usa el código TOTP (6 dígitos) para completar el acceso cuando el login devolvió `requires_two_factor: true`.
 *       - Requiere JWT con `two_factor_pending: true` en `Authorization: Bearer <token>`.
 *       - Si el código es válido, devuelve un nuevo `access_token` con acceso completo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               two_factor_token:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *                 description: Código TOTP de 6 dígitos
 *                 example: "123456"
 *             required:
 *               - two_factor_token
 *     responses:
 *       200:
 *         description: Acceso completo concedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: number
 *                 role_id:
 *                   type: number
 *                   nullable: true
 *                 access_token:
 *                   type: string
 *       400:
 *         description: Código inválido
 *       401:
 *         description: No autorizado
 */
twoFactorLoginRouter.post('/two-factor/login', requireBearerAuthAllowPending, upload.none(), async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).userId);
    const pending = (req as any).twoFactorPending === true;
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }
    if (!pending) {
      throw new ValidationError('El token no está en estado de 2FA pendiente.', 400);
    }

    const tokenInput = typeof req.body?.two_factor_token === 'string' ? req.body.two_factor_token : (typeof req.body?.token === 'string' ? req.body.token : undefined);
    if (!tokenInput || !/^\d{6}$/.test(tokenInput)) {
      throw new ValidationError('two_factor_token debe ser un código de 6 dígitos.', 400);
    }

    const result = await completeTwoFactorLoginService(userId, tokenInput);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? 'Error completando login 2FA';
    if (status >= 500) logger.error(message); else logger.warn(message);
    res.status(status).json({ error: message });
  }
});