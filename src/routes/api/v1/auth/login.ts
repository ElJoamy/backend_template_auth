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
 *     summary: Login
 *     description: |
 *       Authenticates a user using **email** or **username** plus **password**.
 *       - Password requires at least 8 characters.
 *       - Returns an **access_token (JWT)** to use en `Authorization: Bearer <token>`.
 *       - If an active session already exists for the user, returns **409 Conflict**.
 *       - If 2FA is enabled for the user y no envías `two_factor_token`, el login es en **dos pasos**:
 *         - Respuesta incluye `requires_two_factor: true` y el token tendrá `two_factor_pending: true`.
 *         - Ese token NO tiene acceso a endpoints protegidos.
 *         - Luego llama a `POST /api/v1/auth/two-factor/login` con el código 2FA para obtener acceso completo.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             email_login:
 *               summary: Login using email
 *               value:
 *                 email: john@example.com
 *                 password: MyPassw0rd!
 *             email_login_2fa:
 *               summary: Login using email with 2FA enabled
 *               value:
 *                 email: john@example.com
 *                 password: MyPassw0rd!
 *                 two_factor_token: "123456"
 *             username_login:
 *               summary: Login using username
 *               value:
 *                 username: john123
 *                 password: MyPassw0rd!
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             email_login_form:
 *               summary: Login (form-data) using email
 *               value:
 *                 email: john@example.com
 *                 password: MyPassw0rd!
 *             email_login_form_2fa:
 *               summary: Login (form-data) using email with 2FA enabled
 *               value:
 *                 email: john@example.com
 *                 password: MyPassw0rd!
 *                 two_factor_token: "123456"
 *             username_login_form:
 *               summary: Login (form-data) using username
 *               value:
 *                 username: john123
 *                 password: MyPassw0rd!
 *     responses:
 *       '200':
 *         description: Login exitoso (puede requerir 2FA)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               no_2fa:
 *                 summary: 2FA no habilitado
 *                 value:
 *                   user_id: 1
 *                   role_id: 2
 *                   access_token: "<JWT>"
 *               two_step:
 *                 summary: 2FA habilitado, requiere segundo paso
 *                 value:
 *                   user_id: 1
 *                   role_id: 2
 *                   access_token: "<JWT with two_factor_pending>"
 *                   requires_two_factor: true
 *       '400':
 *         description: Token 2FA inválido cuando se proporciona
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: An active session already exists for the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid credentials
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
      logger.warn(`Invalid login: ${message}`);
    } else {
      logger.error(`Login failed: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});