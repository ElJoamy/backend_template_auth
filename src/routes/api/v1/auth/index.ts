import { Router } from 'express';
import { registerRouter } from './register';
import { loginRouter } from './login';
import { logoutRouter } from './logout';
import { personalTokenRouter } from './personal_token';
import { twoFactorLoginRouter } from './two_factor_login';

export const authRouterV1 = Router();

authRouterV1.use(registerRouter);
authRouterV1.use(loginRouter);
authRouterV1.use(logoutRouter);
authRouterV1.use(personalTokenRouter);
authRouterV1.use(twoFactorLoginRouter);