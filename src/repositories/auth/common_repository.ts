import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { Users } from '../../models/database/dbName/user_model';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export interface UserRecord {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role_id: number | null;
  role_name: string | null;
  avatar_type: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUserById(id: number): Promise<UserRecord | null> {
  const entity: any = await Users.findUnique({ where: { id }, include: { roles: true } });
  return entity ? toUserRecord(entity as any) : null;
}

export function toUserRecord(entity: any): UserRecord {
  return {
    id: entity.id,
    name: entity.name,
    lastname: entity.lastname,
    username: entity.username,
    email: entity.email,
    phone: entity.phone ?? null,
    password_hash: entity.password_hash ?? entity.passwordHash,
    role_id: entity.roles ? entity.roles.id : (entity.role_id ?? null),
    role_name: entity.roles ? entity.roles.name ?? null : null,
    avatar_type: entity.avatar_type ?? entity.avatarType ?? null,
    created_at: entity.created_at ?? entity.createdAt,
    updated_at: entity.updated_at ?? entity.updatedAt,
  };
}

logger.debug('common_repository (Prisma) initialized: shared user mapping and access.');