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
 *     summary: Registro de usuario
 *     description: |
 *       Crea un nuevo usuario.
 *       - `username`: 3-20 caracteres; letras, números, `.` `_` `-`.
 *       - `email`: formato de email válido.
 *       - `phone`: 6-15 dígitos, sin espacios ni símbolos.
 *       - `password`: mínima de 8; debe incluir mayúscula, minúscula, número y símbolo; sin dígitos secuenciales.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Juan
 *             lastname: Pérez
 *             username: juanperez
 *             email: juan@example.com
 *             phone: "600123456"
 *             password: MiPassw0rd!
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Juan
 *             lastname: Pérez
 *             username: juanperez
 *             email: juan@example.com
 *             phone: "600123456"
 *             password: MiPassw0rd!
 *     responses:
 *       '201':
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       '400':
 *         description: Datos inválidos o duplicados
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
      logger.warn(`Registro inválido: ${message}`);
    } else {
      logger.error(`Fallo en registro: ${message}`);
    }
    res.status(status).json({ error: message });
  }
});