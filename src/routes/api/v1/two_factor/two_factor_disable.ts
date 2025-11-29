import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { disableTwoFactorService, removeTwoFactorService } from '../../../../services/two_factor/two_factor_service';
import { requireBearerAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

export const twoFactorDisableRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/two-factor/disable:
 *   post:
 *     tags:
 *       - Two Factor Authentication
 *     summary: Deshabilitar 2FA
 *     description: |
 *       Deshabilita 2FA para un usuario manteniendo la configuración.
 *       - Requiere verificación con código TOTP actual
 *       - Mantiene la configuración para poder reactivar fácilmente
 *       - El usuario podrá volver a habilitar 2FA sin reconfigurar
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *                 description: Código de 6 dígitos actual para verificación
 *                 example: "123456"
 *             required:
 *               - token
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Respuesta de deshabilitación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indica si la operación fue exitosa
 *                 message:
 *                   type: string
 *                   description: Mensaje descriptivo del resultado
 *               examples:
 *                 success:
 *                   summary: Deshabilitación exitosa
 *                   value:
 *                     success: true
 *                     message: "2FA deshabilitado correctamente."
 *                 failure:
 *                   summary: Código inválido
 *                   value:
 *                     success: false
 *                     message: "Código de verificación inválido."
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado o 2FA no habilitado
 *       500:
 *         description: Error interno del servidor
 */
twoFactorDisableRouter.post('/two-factor/disable', requireBearerAuth, upload.none(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }

    const result = await disableTwoFactorService(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/two-factor/remove:
 *   delete:
 *     tags:
 *       - Two Factor Authentication
 *     summary: Eliminar configuración 2FA
 *     description: |
 *       Elimina completamente la configuración 2FA de un usuario.
 *       - Requiere verificación con código TOTP si está habilitado
 *       - Elimina permanentemente toda la configuración 2FA
 *       - El usuario tendrá que reconfigurar desde cero si quiere usar 2FA nuevamente
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *                 description: Código de 6 dígitos para verificación (requerido si 2FA está habilitado)
 *                 example: "123456"
 *             required:
 *               - token
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Respuesta de eliminación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indica si la operación fue exitosa
 *                 message:
 *                   type: string
 *                   description: Mensaje descriptivo del resultado
 *               examples:
 *                 success:
 *                   summary: Eliminación exitosa
 *                   value:
 *                     success: true
 *                     message: "Configuración 2FA eliminada correctamente."
 *                 failure:
 *                   summary: Código inválido
 *                   value:
 *                     success: false
 *                     message: "Código de verificación inválido."
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado o configuración 2FA no existe
 *       500:
 *         description: Error interno del servidor
 */
twoFactorDisableRouter.delete('/two-factor/remove', requireBearerAuth, upload.none(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }

    const result = await removeTwoFactorService(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});