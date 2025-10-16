import { setupLogger } from '../../utils/logger';
import { getAppSettings, getUserAdminSettings, type AppSettings, type UserSettings } from '../../config/settings';
import { RoleName } from '../../schemas/roles';
import { emailExists, usernameExists, getRoleIdByName, createUser } from '../../repositories/auth/register_repository';
import { hashPassword } from '../../utils/password_utils';
import { prisma } from '../../config/db_config';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

async function generateUniqueServicePhone(): Promise<string> {
  const base = 600000000; // 9 dígitos
  for (let i = 0; i < 1000; i++) {
    const candidate = String(base + i);
    const count = await prisma.users.count({ where: { phone: candidate } });
    if (count === 0) return candidate;
  }
  // En caso extremo, usa timestamp mod 1e9
  const fallback = String(100000000 + Math.floor(Date.now() % 900000000));
  return fallback;
}

export async function ensureAdminUser(): Promise<void> {
  const admin: UserSettings = getUserAdminSettings();
  const username = admin.service_user;
  const email = admin.service_user_email;
  const pass = admin.service_user_pass;

  // Solo crear si no existe (no actualizar)
  const existsByEmail = await emailExists(email);
  const existsByUsername = await usernameExists(username);
  if (existsByEmail || existsByUsername) {
    logger.info(`Admin user ya existe (email=${email}, username=${username}); se omite creación`);
    return;
  }

  const roleId = await getRoleIdByName(RoleName.SUPER_ADMIN);
  if (!roleId) {
    logger.warn('Rol SUPER_ADMIN no encontrado; se crea admin sin role_id (asignar manualmente después)');
  }

  const password_hash = await hashPassword(pass);
  const phone = await generateUniqueServicePhone();

  const user = await createUser({
    name: 'Service',
    lastname: 'Admin',
    username,
    email,
    phone,
    password_hash,
    role_id: roleId ?? null,
  });

  logger.info(`Usuario admin asegurado: id=${user.id}, username=${username}, email=${email}`);
}