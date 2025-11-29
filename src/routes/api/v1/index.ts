import { Router } from 'express';
import { authRouterV1 } from './auth';
import { profileRouterV1 } from './profile';
import { twoFactorRouter } from './two_factor';

export const apiRouterV1 = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticación
 *   - name: Two Factor Authentication
 *     description: Endpoints de autenticación de dos factores (2FA)
 */
apiRouterV1.use('/auth', authRouterV1);
apiRouterV1.use('/profile', profileRouterV1);
apiRouterV1.use('/', twoFactorRouter);

export default apiRouterV1;