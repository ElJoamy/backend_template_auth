import { Router } from 'express';
import { registerRouter } from './register';
import { loginRouter } from './login';
import { logoutRouter } from './logout';

export const authRouterV1 = Router();

authRouterV1.use(registerRouter);
authRouterV1.use(loginRouter);
authRouterV1.use(logoutRouter);