import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setupLogger } from '../../../../utils/logger';
import { getAppSettings, type AppSettings } from '../../../../config/settings';
import { registerService } from '../../../../services/auth/register_service';
import { ValidationError } from '../../../../utils/errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const registerRouter = Router();
const upload = multer();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: User registration
 *     description: |
 *       Creates a new user.
 *       - `username`: 3-20 characters; letters, numbers, `.` `_` `-`.
 *       - `email`: valid email format.
 *       - `phone`: 6-15 digits, no spaces or symbols.
 *       - `password`: at least 8; must include uppercase, lowercase, number, and symbol; no sequential digits.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: John
 *             lastname: Doe
 *             username: johndoe
 *             email: john@example.com
 *             phone: "600123456"
 *             password: MyPassw0rd!
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: John
 *             lastname: Doe
 *             username: johndoe
 *             email: john@example.com
 *             phone: "600123456"
 *             password: MyPassw0rd!
 *     responses:
 *       '201':
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       '400':
 *         description: Invalid or duplicate data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
registerRouter.post('/register', upload.none(), async (req: Request, res: Response) => {
  try {
    const { user } = await registerService(req.body);
    res.status(201).json({ user });
  } catch (err: any) {
    const status = err?.statusCode ?? 400;
    const message = err?.message ?? 'Error en registro';
    if (err instanceof ValidationError) {
      logger.warn(`Invalid registration: ${message}`);
    } else {
      logger.error(`Registration failed: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});