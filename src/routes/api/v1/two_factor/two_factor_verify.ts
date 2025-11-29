import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { verifyAndEnableTwoFactorService } from '../../../../services/two_factor/two_factor_service';
import { requireBearerAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

export const twoFactorVerifyRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/two-factor/verify:
 *   post:
 *     tags:
 *       - Two Factor Authentication
 *     summary: Verificar y habilitar 2FA
 *     description: |
 *       Verifica un código TOTP y habilita 2FA si el código es correcto.
 *       - Debe llamarse después de configurar 2FA con /setup
 *       - Verifica el código de 6 dígitos generado por la app de autenticación
 *       - Si es correcto, habilita permanentemente 2FA para el usuario
 *       - Devuelve **códigos de recuperación** (10) y un **access_token** con acceso completo
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
 *                 description: Código de 6 dígitos generado por la app de autenticación
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
 *         description: 2FA habilitado y códigos de recuperación generados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indica si la verificación fue exitosa
 *                 message:
 *                   type: string
 *                   description: Mensaje descriptivo del resultado
 *                 recovery_codes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Lista de 10 códigos de recuperación en texto claro
 *                 access_token:
 *                   type: string
 *                   description: Token de acceso con 2FA completado
 *               examples:
 *                 success:
 *                   summary: Verificación exitosa
 *                   value:
 *                     success: true
 *                     message: "2FA habilitado correctamente."
 *                     recovery_codes: ["ABCD-EFGH-IJKL", "MNOP-QRST-UVWX", "...."]
 *                     access_token: "<JWT>"
 *                 failure:
 *                   summary: Código inválido
 *                   value:
 *                     success: false
 *                     message: "Código de verificación inválido."
 *       400:
 *         description: Error de validación (token inválido)
 *       404:
 *         description: Usuario no encontrado o configuración 2FA no existe
 *       409:
 *         description: 2FA ya está habilitado para este usuario
 *       500:
 *         description: Error interno del servidor
 */
twoFactorVerifyRouter.post('/two-factor/verify', requireBearerAuth, upload.none(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }

    const result = await verifyAndEnableTwoFactorService(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});