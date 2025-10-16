import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { RoleName } from '../../schemas/roles';
import { Users } from '../../models/database/dbName/user_model';
import { Roles } from '../../models/database/dbName/role_model';
import { toUserRecord, type UserRecord } from './common_repository';
import type { RegisterRequest } from '../../schemas/auth/register/request';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export type { UserRecord };

export async function emailExists(email: RegisterRequest['email']): Promise<boolean> {
  const count = await Users.count({ where: { email } });
  return count > 0;
}

export async function usernameExists(username: RegisterRequest['username']): Promise<boolean> {
  const count = await Users.count({ where: { username } });
  return count > 0;
}

export async function getRoleIdByName(name: RoleName): Promise<number | null> {
  const role: any = await Roles.findFirst({ where: { name } });
  return role ? role.id : null;
}

export interface CreateUserParams
  extends Pick<RegisterRequest, 'name' | 'lastname' | 'username' | 'email' | 'phone'> {
  password_hash: string;
  role_id?: number | null;
}

export async function createUser(params: CreateUserParams): Promise<UserRecord> {
  let data: any = {
    name: params.name,
    lastname: params.lastname,
    username: params.username,
    email: params.email,
    password_hash: params.password_hash,
  };

  if (params.phone !== undefined && params.phone !== null && String(params.phone).trim().length > 0) {
    data.phone = params.phone;
  }

  if (params.role_id !== null && params.role_id !== undefined) {
    // Prefer relation connect; matches model 'users' relation 'roles'
    data.roles = { connect: { id: params.role_id } };
  }

  const saved: any = await Users.create({ data, include: { roles: true } });
  logger.info(`User created with id=${saved.id}`);
  logger.debug(`register_repository: user created id=${saved.id}`);
  return toUserRecord(saved);
}