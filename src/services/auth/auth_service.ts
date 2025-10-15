import type { PublicUser } from '../../schemas/auth/common/user';
import type { LoginResponse } from '../../schemas/auth/login/response';
import { registerService } from './register_service';
import { loginService } from './login_service';

export type { PublicUser };
export type LoginResult = LoginResponse;

export async function register(rawBody: any): Promise<PublicUser> {
  const { user } = await registerService(rawBody);
  return user;
}

export async function login(rawBody: any): Promise<LoginResult> {
  return await loginService(rawBody);
}