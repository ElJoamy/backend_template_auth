import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { RoleName } from '../../schemas/roles';
import { AppDataSource } from '../../config/orm_config';
import { User } from '../../models/database/dbName/user_model';
import { Role } from '../../models/database/dbName/role_model';
import { toUserRecord, type UserRecord } from './common_repository';
import type { RegisterRequest } from '../../schemas/auth/register/request';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export type { UserRecord };

export async function emailExists(email: RegisterRequest['email']): Promise<boolean> {
  const repo = AppDataSource.getRepository(User);
  const count = await repo.count({ where: { email } });
  return count > 0;
}

export async function usernameExists(username: RegisterRequest['username']): Promise<boolean> {
  const repo = AppDataSource.getRepository(User);
  const count = await repo.count({ where: { username } });
  return count > 0;
}

export async function getRoleIdByName(name: RoleName): Promise<number | null> {
  const repo = AppDataSource.getRepository(Role);
  const role = await repo.findOne({ where: { name } });
  return role ? role.id : null;
}

export interface CreateUserParams
  extends Pick<RegisterRequest, 'name' | 'lastname' | 'username' | 'email' | 'phone'> {
  password_hash: string;
  role_id?: number | null;
}

export async function createUser(params: CreateUserParams): Promise<UserRecord> {
  const userRepo = AppDataSource.getRepository(User);
  let roleEntity: Role | undefined = undefined;
  if (params.role_id !== null && params.role_id !== undefined) {
    const repoRole = AppDataSource.getRepository(Role);
    const foundRole = await repoRole.findOne({ where: { id: params.role_id } });
    if (!foundRole) {
      logger.warn(`Role id=${params.role_id} not found; user will be created without role`);
    } else {
      roleEntity = foundRole;
    }
  }

  const entity = userRepo.create({
    name: params.name,
    lastname: params.lastname,
    username: params.username,
    email: params.email,
    phone: params.phone,
    passwordHash: params.password_hash,
    role: roleEntity,
  });

  const saved = await userRepo.save(entity);
  logger.info(`User created with id=${saved.id}`);
  logger.debug(`register_repository: user created id=${saved.id}`);
  return toUserRecord(saved);
}