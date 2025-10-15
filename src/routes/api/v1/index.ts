import { Router } from 'express';
import { authRouterV1 } from './auth';

export const apiRouterV1 = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticación
 */
apiRouterV1.use('/auth', authRouterV1);

export default apiRouterV1;