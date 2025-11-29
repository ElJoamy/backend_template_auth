import fs from 'fs';
import path from 'path';
import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { ValidationError } from '../../utils/errors';
import { parseUpdateProfileRequest, type UpdateProfileRequest } from '../../schemas/profile/update_request';
import type { GetProfileResponse, UpdateProfileResponse } from '../../schemas/profile/response';
import { getProfileById, updateProfile, usernameExistsForOther, phoneExistsForOther } from '../../repositories/profile/profile_repository';
import { updateUserPassword } from '../../repositories/profile/profile_repository';
import { validateProfilePhoto } from '../../utils/image_validation';
import { ImageType } from '../../schemas/media/image_types';
import { parsePasswordUpdateRequest } from '../../schemas/profile/password_update_request';
import { verifyPassword, hashPassword } from '../../utils/password_utils';
import { getUserById } from '../../repositories/auth/common_repository';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function getProfileService(id: number): Promise<GetProfileResponse> {
  const user = await getProfileById(id);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }
  return { user };
}

export async function updateProfileService(
  id: number,
  rawBody: any,
  avatarFile?: { originalname: string; mimetype: string; buffer: Buffer; size?: number }
): Promise<UpdateProfileResponse> {
  const changes: UpdateProfileRequest = parseUpdateProfileRequest(rawBody);

  if (changes.username) {
    const exists = await usernameExistsForOther(id, changes.username);
    if (exists) throw new ValidationError('Username ya en uso.');
  }
  if (changes.phone) {
    const exists = await phoneExistsForOther(id, changes.phone);
    if (exists) throw new ValidationError('Phone ya en uso.');
  }

  // Si no viene archivo y no hay cambios de texto, rechazar la actualización
  if (!avatarFile &&
      changes.name === undefined &&
      changes.lastname === undefined &&
      changes.username === undefined &&
      changes.phone === undefined) {
    throw new ValidationError('Debe proporcionar al menos un campo o el avatar.');
  }

  if (avatarFile) {
    const content = validateProfilePhoto({
      originalname: avatarFile.originalname,
      mimetype: avatarFile.mimetype,
      buffer: avatarFile.buffer,
      size: avatarFile.size,
    });
    // Derivar tipo automáticamente: primero por mimetype, luego normalizamos contenido real
    let avatarType: ImageType | undefined = undefined;
    const mime = (avatarFile.mimetype || '').toLowerCase();
    if (mime === 'image/jpeg') {
      avatarType = ImageType.JPEG;
    } else if (mime === 'image/png') {
      avatarType = ImageType.PNG;
    } else if (mime === 'image/heic') {
      avatarType = ImageType.HEIC;
    } else if (mime === 'image/heif') {
      avatarType = ImageType.HEIF;
    }

    if (!avatarType) {
      throw new ValidationError('No se pudo determinar el tipo de avatar.');
    }

    const avatarsDir = path.resolve(process.cwd(), 'media', 'avatars');
    try {
      fs.mkdirSync(avatarsDir, { recursive: true });
    } catch {}
    const filename = `user_${id}.${avatarType === ImageType.JPEG ? 'jpeg' : avatarType}`;
    const fullPath = path.join(avatarsDir, filename);
    fs.writeFileSync(fullPath, content);
    logger.info(`Avatar guardado: ${fullPath}`);

    changes.avatar_type = avatarType;
  }

  const user = await updateProfile(id, changes);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }
  return { user };
}

export async function updatePasswordService(
  id: number,
  rawBody: any
): Promise<{ success: boolean }>{
  const user = await getProfileById(id);
  if (!user) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }
  const { current_password, new_password } = parsePasswordUpdateRequest(rawBody);
  // necesitamos el hash actual; recuperar entidad completa
  // Usamos common_repository.getUserById para obtener el password_hash
  // pero aquí tenemos sólo ProfileUser; volvemos a consultar con repositorio común
  const full = await getUserById(id);
  if (!full) {
    throw new ValidationError('Usuario no encontrado.', 404);
  }
  const ok = await verifyPassword(current_password, full.password_hash);
  if (!ok) {
    throw new ValidationError('Password actual incorrecta.', 401);
  }
  const newHash = await hashPassword(new_password);
  const updated = await updateUserPassword(id, newHash);
  if (!updated) {
    throw new ValidationError('No se pudo actualizar la password.', 500);
  }
  return { success: true };
}