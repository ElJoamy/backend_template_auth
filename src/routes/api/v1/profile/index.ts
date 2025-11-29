import { Router } from 'express';
import { getProfileRouter } from './profile_get';
import { putProfileRouter } from './profile_put';
import { patchProfileRouter } from './profile_patch';
import { passwordRouter } from './profile_password';

export const profileRouterV1 = Router();

/**
 * @openapi
 * tags:
 *   - name: Profile
 *     description: Endpoints de perfil de usuario
 */
profileRouterV1.use(getProfileRouter);
profileRouterV1.use(putProfileRouter);
profileRouterV1.use(patchProfileRouter);
profileRouterV1.use(passwordRouter);

export default profileRouterV1;