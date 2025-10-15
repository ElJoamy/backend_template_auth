import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { AppDataSource } from '../../config/orm_config';
import { User } from '../../models/database/dbName/user_model';
import { toUserRecord, type UserRecord } from './common_repository';
import type { LoginRequest } from '../../schemas/auth/login/request';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export type { UserRecord };

export async function getUserByEmail(email: NonNullable<LoginRequest['email']>): Promise<UserRecord | null> {
  const repo = AppDataSource.getRepository(User);
  const entity = await repo.findOne({ where: { email }, relations: ['role'] });
  const user = entity ? toUserRecord(entity) : null;
  logger.debug(`login_repository: getUserByEmail(${email}) -> ${user ? 'found' : 'null'}`);
  return user;
}

export async function getUserByUsername(username: NonNullable<LoginRequest['username']>): Promise<UserRecord | null> {
  const repo = AppDataSource.getRepository(User);
  const entity = await repo.findOne({ where: { username }, relations: ['role'] });
  const user = entity ? toUserRecord(entity) : null;
  logger.debug(`login_repository: getUserByUsername(${username}) -> ${user ? 'found' : 'null'}`);
  return user;
}