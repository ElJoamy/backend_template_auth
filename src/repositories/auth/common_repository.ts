import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { AppDataSource } from '../../config/orm_config';
import { User } from '../../models/database/dbName/user_model';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export interface UserRecord {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  role_id: number | null;
  role_name: string | null;
  avatar_type: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUserById(id: number): Promise<UserRecord | null> {
  const repo = AppDataSource.getRepository(User);
  const entity = await repo.findOne({ where: { id }, relations: ['role'] });
  return entity ? toUserRecord(entity) : null;
}

export function toUserRecord(entity: User): UserRecord {
  return {
    id: entity.id,
    name: entity.name,
    lastname: entity.lastname,
    username: entity.username,
    email: entity.email,
    phone: entity.phone,
    password_hash: entity.passwordHash,
    role_id: entity.role ? entity.role.id : null,
    role_name: entity.role ? (entity.role as any).name ?? null : null,
    avatar_type: entity.avatarType ?? null,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
  };
}

logger.debug('common_repository initialized: shared user mapping and access.');