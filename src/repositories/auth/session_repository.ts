import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { AppDataSource } from '../../config/orm_config';
import { Session } from '../../models/database/dbName/session_model';
import { User } from '../../models/database/dbName/user_model';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export interface SessionRecord {
  id: number;
  user_id: number;
  jti: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
}

export function toSessionRecord(entity: Session): SessionRecord {
  return {
    id: entity.id,
    user_id: (entity as any).user?.id ?? (entity as any).user_id ?? 0,
    jti: entity.jti,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    expires_at: entity.expiresAt,
    revoked_at: entity.revokedAt ?? null,
  };
}

export async function getActiveSessionByUserId(userId: number): Promise<SessionRecord | null> {
  const repo = AppDataSource.getRepository(Session);
  const qb = repo
    .createQueryBuilder('s')
    .where('s.user_id = :userId', { userId })
    .andWhere('s.revoked_at IS NULL')
    .andWhere('s.expires_at > NOW()')
    .orderBy('s.created_at', 'DESC')
    .limit(1);
  const entity = await qb.getOne();
  const rec = entity ? toSessionRecord(entity) : null;
  logger.debug(`session_repository: getActiveSessionByUserId(${userId}) -> ${rec ? 'found' : 'null'}`);
  return rec;
}

export async function createSession(userId: number, jti: string, expiresAt: Date): Promise<SessionRecord> {
  const manager = AppDataSource.manager;
  const userRepo = manager.getRepository(User);
  const sessionRepo = manager.getRepository(Session);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error(`Usuario ${userId} no encontrado para crear sesión`);
  }

  const entity = sessionRepo.create({ user, jti, expiresAt });
  const saved = await sessionRepo.save(entity);
  logger.info(`Sesión creada id=${saved.id} para user_id=${userId}`);
  return toSessionRecord(saved);
}

export async function revokeSessionByJti(jti: string): Promise<boolean> {
  const repo = AppDataSource.getRepository(Session);
  const entity = await repo.findOne({ where: { jti } });
  if (!entity) {
    logger.warn(`No se encontró sesión para jti=${jti} al revocar`);
    return false;
  }
  if (entity.revokedAt) {
    logger.debug(`Sesión jti=${jti} ya estaba revocada`);
    return true;
  }
  entity.revokedAt = new Date();
  await repo.save(entity);
  logger.info(`Sesión revocada jti=${jti}`);
  return true;
}