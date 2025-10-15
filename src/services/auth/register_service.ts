import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { ValidationError } from '../../utils/errors';
import { parseRegisterRequest, type RegisterRequest } from '../../schemas/auth/register/request';
import type { RegisterResponse } from '../../schemas/auth/register/response';
import { hashPassword } from '../../utils/password_utils';
import { RoleName } from '../../schemas/roles';
import {
  emailExists,
  usernameExists,
  getRoleIdByName,
  createUser,
  type UserRecord,
} from '../../repositories/auth/register_repository';
import type { PublicUser } from '../../schemas/auth/common/user';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    name: u.name,
    lastname: u.lastname,
    username: u.username,
    email: u.email,
    phone: u.phone,
    role: {
      id: u.role_id,
      name: u.role_name,
    },
  };
}

export async function registerService(rawBody: any): Promise<RegisterResponse> {
  const input: RegisterRequest = parseRegisterRequest(rawBody);

  if (await emailExists(input.email)) {
    throw new ValidationError('El email ya está registrado.');
  }
  if (await usernameExists(input.username)) {
    throw new ValidationError('El username ya está registrado.');
  }

  const defaultRoleId = await getRoleIdByName(RoleName.MEMBER);
  if (!defaultRoleId) {
    logger.warn('Role MEMBER not found; creating user without role_id');
  }

  const password_hash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    lastname: input.lastname,
    username: input.username,
    email: input.email,
    phone: input.phone,
    password_hash,
    role_id: defaultRoleId ?? null,
  });

  logger.info(`User registered: ${user.email} (id=${user.id})`);
  return { user: toPublicUser(user) };
}