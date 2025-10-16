import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { Sessions } from '../../models/database/dbName/session_model';

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

export function toSessionRecord(entity: any): SessionRecord {
  return {
    id: entity.id,
    user_id: (entity as any).user?.id ?? (entity as any).user_id ?? entity.userId ?? 0,
    jti: entity.jti,
    created_at: entity.created_at ?? entity.createdAt,
    updated_at: entity.updated_at ?? entity.updatedAt,
    expires_at: entity.expires_at ?? entity.expiresAt,
    revoked_at: entity.revoked_at ?? entity.revokedAt ?? null,
  };
}

export async function getActiveSessionByUserId(userId: number): Promise<SessionRecord | null> {
  const entity: any = await Sessions.findFirst({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: [{ created_at: 'desc' }],
  });
  const rec = entity ? toSessionRecord(entity) : null;
  logger.debug(`session_repository: getActiveSessionByUserId(${userId}) -> ${rec ? 'found' : 'null'}`);
  return rec;
}

export async function createSession(userId: number, jti: string, expiresAt: Date): Promise<SessionRecord> {
  const saved: any = await Sessions.create({
    data: {
      users: { connect: { id: userId } },
      jti,
      expires_at: expiresAt,
    },
  });
  logger.info(`Session created id=${saved.id} for user_id=${userId}`);
  return toSessionRecord(saved);
}

export async function revokeSessionByJti(jti: string): Promise<boolean> {
  const entity: any = await Sessions.findFirst({ where: { jti } });
  if (!entity) {
    logger.warn(`No session found for jti=${jti} when revoking`);
    return false;
  }
  if (entity.revoked_at ?? entity.revokedAt) {
    logger.debug(`Session jti=${jti} was already revoked`);
    return false;
  }
  await Sessions.update({ where: { id: entity.id }, data: { revoked_at: new Date() } });
  logger.info(`Session revoked jti=${jti}`);
  return true;
}