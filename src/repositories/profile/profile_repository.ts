import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { Users } from '../../models/database/dbName/user_model';
import { getUserById, toUserRecord, type UserRecord } from '../auth/common_repository';
import type { UpdateProfileRequest } from '../../schemas/profile/update_request';
import type { ProfileUser } from '../../schemas/profile/user';
import type { PasswordUpdateRequest } from '../../schemas/profile/password_update_request';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function getProfileById(id: number): Promise<ProfileUser | null> {
  const entity: any = await Users.findUnique({ where: { id }, include: { roles: true } });
  if (!entity) return null;
  const user = toUserRecord(entity as any);
  return toProfileUser(user);
}

export async function usernameExistsForOther(id: number, username: string): Promise<boolean> {
  const count = await Users.count({ where: { username, NOT: { id } } });
  return count > 0;
}

export async function phoneExistsForOther(id: number, phone: string): Promise<boolean> {
  const count = await Users.count({ where: { phone, NOT: { id } } });
  return count > 0;
}

export async function updateProfile(
  id: number,
  changes: UpdateProfileRequest
): Promise<ProfileUser | null> {
  const data: any = {};
  if (changes.name !== undefined) data.name = changes.name;
  if (changes.lastname !== undefined) data.lastname = changes.lastname;
  if (changes.username !== undefined) data.username = changes.username;
  if (changes.phone !== undefined) data.phone = changes.phone;
  if (changes.avatar_type !== undefined) data.avatar_type = changes.avatar_type;

  if (Object.keys(data).length === 0) {
    return await getProfileById(id);
  }

  const updated: any = await Users.update({ where: { id }, data, include: { roles: true } });
  const user = toUserRecord(updated as any);
  logger.info(`Profile updated for user ${id}`);
  return toProfileUser(user);
}

function toProfileUser(user: UserRecord): ProfileUser {
  return {
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar_type: user.avatar_type,
    role: {
      id: user.role_id,
      name: user.role_name,
    },
  };
}

export async function updateUserPassword(
  id: number,
  newPasswordHash: string
): Promise<boolean> {
  const entity: any = await Users.findUnique({ where: { id } });
  if (!entity) return false;
  await Users.update({ where: { id }, data: { password_hash: newPasswordHash } });
  logger.info(`Password updated for user ${id}`);
  return true;
}