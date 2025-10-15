import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { loginService } from '../../../../services/auth/login_service';
import { AuthError, ValidationError } from '../../../../utils/errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const loginRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicio de sesión
 *     description: |
 *       Autentica a un usuario usando **email** o **username** más **password**.
 *       - Password requiere mínimo 8 caracteres.
 *       - Devuelve un **access_token (JWT)** para usar en `Authorization: Bearer <token>`.
 *       - Si ya existe una sesión activa para el usuario, devuelve **409 Conflict**.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             email_login:
 *               summary: Login usando email
 *               value:
 *                 email: usuario@example.com
 *                 password: MiPassw0rd!
 *             username_login:
 *               summary: Login usando username
 *               value:
 *                 username: usuario123
 *                 password: MiPassw0rd!
  *         multipart/form-data:
  *           schema:
  *             $ref: '#/components/schemas/LoginRequest'
  *           examples:
  *             email_login_form:
  *               summary: Login (form-data) usando email
  *               value:
  *                 email: usuario@example.com
  *                 password: MiPassw0rd!
  *             username_login_form:
  *               summary: Login (form-data) usando username
  *               value:
  *                 username: usuario123
  *                 password: MiPassw0rd!
 *     responses:
 *       '200':
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       '409':
 *         description: Ya existe una sesión activa para el usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
loginRouter.post('/login', upload.none(), async (req: Request, res: Response) => {
  try {
    const result = await loginService(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode ?? 401;
    const message = err?.message ?? 'Error en login';
    if (err instanceof AuthError || err instanceof ValidationError) {
      logger.warn(`Login inválido: ${message}`);
    } else {
      logger.error(`Fallo en login: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});