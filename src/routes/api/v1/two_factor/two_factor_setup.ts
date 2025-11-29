import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { setupTwoFactorService } from '../../../../services/two_factor/two_factor_service';
import { requireBearerAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

export const twoFactorSetupRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/two-factor/setup:
 *   post:
 *     tags:
 *       - Two Factor Authentication
 *     summary: Configurar 2FA para un usuario
 *     description: Genera un secreto y código QR para configurar autenticación de dos factores. El issuer se toma automáticamente del nombre del servicio y el label se genera usando el email del usuario autenticado. No es necesario enviar ningún campo en el cuerpo de la solicitud.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {}
 *     responses:
 *       200:
 *         description: Configuración 2FA generada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: Secreto base32 para configuración manual
 *                 qr_code_url:
 *                   type: string
 *                   description: URL otpauth:// para generar código QR
 *                 manual_entry_key:
 *                   type: string
 *                   description: Clave para entrada manual (igual que secret)
 *                 issuer:
 *                   type: string
 *                   description: Nombre del emisor usado
 *                 label:
 *                   type: string
 *                   description: Etiqueta usada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: 2FA ya está habilitado para este usuario
 *       500:
 *         description: Error interno del servidor
 */
twoFactorSetupRouter.post('/two-factor/setup', requireBearerAuth, upload.none(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }

    const result = await setupTwoFactorService(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});