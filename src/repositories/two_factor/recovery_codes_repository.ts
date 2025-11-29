import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { RecoveryCodes } from '../../models/database/dbName/recovery_code_model';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export interface RecoveryCodeRecord {
  id: number;
  user_id: number;
  code_hash: string;
  used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toRecoveryCodeRecord(entity: any): RecoveryCodeRecord {
  return {
    id: entity.id,
    user_id: (entity as any).user_id ?? (entity as any).userId,
    code_hash: entity.code_hash ?? entity.codeHash,
    used_at: entity.used_at ?? entity.usedAt ?? null,
    created_at: entity.created_at ?? entity.createdAt,
    updated_at: entity.updated_at ?? entity.updatedAt,
  };
}

export async function createRecoveryCodes(userId: number, codeHashes: string[]): Promise<RecoveryCodeRecord[]> {
  const rows: RecoveryCodeRecord[] = [];
  for (const h of codeHashes) {
    const saved: any = await RecoveryCodes.create({
      data: {
        users: { connect: { id: userId } },
        code_hash: h,
      },
    });
    rows.push(toRecoveryCodeRecord(saved));
  }
  logger.info(`Generated ${rows.length} recovery codes for user_id=${userId}`);
  return rows;
}

export async function getUnusedRecoveryCodeByUser(userId: number): Promise<RecoveryCodeRecord | null> {
  const row: any = await RecoveryCodes.findFirst({ where: { user_id: userId, used_at: null } });
  return row ? toRecoveryCodeRecord(row) : null;
}

export async function markRecoveryCodeAsUsed(id: number): Promise<void> {
  await RecoveryCodes.update({ where: { id }, data: { used_at: new Date() } });
}

export async function deleteAllRecoveryCodes(userId: number): Promise<number> {
  const res = await RecoveryCodes.deleteMany({ where: { user_id: userId } });
  logger.info(`Deleted ${res.count} recovery codes for user_id=${userId}`);
  return res.count;
}