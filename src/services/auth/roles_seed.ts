import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { prisma } from '../../config/db_config';
import { DEFAULT_ROLES, RoleName } from '../../schemas/roles';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function ensureDefaultRoles(): Promise<void> {
  logger.info('Seeding roles: comprobando roles por nombre (idempotente)');
  for (const role of DEFAULT_ROLES) {
    const name = role.name as RoleName;
    const description = role.description;
    try {
      await prisma.roles.upsert({
        where: { name },
        update: { description },
        create: { name, description },
      });
      logger.info(`Rol '${name}' asegurado (insertado/actualizado)`);
    } catch (err: any) {
      logger.error(`Error asegurando rol '${name}': ${err?.message ?? err}`);
    }
  }
  logger.info('Seeding roles: completado');
}