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
 *       - Returns an **access_token (JWT)** to use in `Authorization: Bearer <token>`.
 *       - If an active session already exists for the user, returns **409 Conflict**.
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
  *             username_login_form:
  *               summary: Login (form-data) using username
  *               value:
  *                 username: john123
  *                 password: MyPassw0rd!
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
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