import { Router, Request, Response, NextFunction } from 'express';
import { getTwoFactorStatusService } from '../../../../services/two_factor/two_factor_service';
import { requireBearerAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

export const twoFactorStatusRouter = Router();

/**
 * @openapi
 * /api/v1/two-factor/status:
 *   get:
 *     tags:
 *       - Two Factor Authentication
 *     summary: Obtener estado de 2FA
 *     description: |
 *       Obtiene el estado actual de la configuración 2FA para un usuario.
 *       - Indica si 2FA está habilitado o no
 *       - Muestra cuándo fue confirmado por primera vez
 *       - Incluye información del emisor y etiqueta configurados
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     responses:
 *       200:
 *         description: Estado de 2FA obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 is_enabled:
 *                   type: boolean
 *                   description: Indica si 2FA está habilitado
 *                 confirmed_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Fecha y hora cuando se habilitó 2FA por primera vez
 *                 issuer:
 *                   type: string
 *                   nullable: true
 *                   description: Nombre del emisor configurado
 *                 label:
 *                   type: string
 *                   nullable: true
 *                   description: Etiqueta configurada
 *               examples:
 *                 enabled:
 *                   summary: 2FA habilitado
 *                   value:
 *                     is_enabled: true
 *                     confirmed_at: "2024-01-15T10:30:00.000Z"
 *                     issuer: "Mi Aplicación"
 *                     label: "juan@ejemplo.com"
 *                 disabled:
 *                   summary: 2FA no configurado
 *                   value:
 *                     is_enabled: false
 *                     confirmed_at: null
 *                     issuer: null
 *                     label: null
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
twoFactorStatusRouter.get('/two-factor/status', requireBearerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ValidationError('Usuario no autenticado.', 401);
    }

    const result = await getTwoFactorStatusService(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});