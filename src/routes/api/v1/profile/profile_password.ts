import { Router, Request, Response, NextFunction } from 'express';
import { updatePasswordService } from '../../../../services/profile/profile_service';
import { requireAuth } from '../../../../middlewares/auth';
import { ValidationError } from '../../../../utils/errors';

export const passwordRouter = Router();

  /**
   * @openapi
   * /api/v1/profile/password:
   *   patch:
   *     tags:
   *       - Profile
  *     summary: Actualiza la contraseña del usuario
  *     description: Verifica la contraseña actual y guarda una nueva contraseña segura.
  *     security:
  *       - bearerAuth: []
  *       - apiKeyAuth: []
  *     parameters: []
  *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               current_password:
   *                 type: string
   *               new_password:
   *                 type: string
   *             required:
   *               - current_password
   *               - new_password
   *     responses:
   *       200:
   *         description: Contraseña actualizada correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *       400:
   *         description: Error de validación
   *       401:
   *         description: Password actual incorrecta
   *       404:
   *         description: Usuario no encontrado
   *       500:
   *         description: Error interno
   */
  passwordRouter.patch('/password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number((req as any).userId);
      const result = await updatePasswordService(userId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });