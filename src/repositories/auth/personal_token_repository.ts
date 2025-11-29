import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { PersonalTokens } from '../../models/database/dbName/personal_token_model';
import { PersonalTokenExpiryPreset } from '../../schemas/personal_token';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export interface PersonalTokenRecord {
  id: number;
  user_id: number;
  token_hash: string;
  name: string | null;
  expires_preset?: PersonalTokenExpiryPreset | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toPersonalTokenRecord(entity: any): PersonalTokenRecord {
  return {
    id: entity.id,
    user_id: (entity as any).user_id ?? (entity as any).userId,
    token_hash: entity.token_hash ?? entity.tokenHash,
    name: entity.name ?? null,
    expires_preset: (entity as any).expires_preset ?? null,
    expires_at: entity.expires_at ?? entity.expiresAt,
    revoked_at: entity.revoked_at ?? entity.revokedAt ?? null,
    created_at: entity.created_at ?? entity.createdAt,
    updated_at: entity.updated_at ?? entity.updatedAt,
  };
}

export async function createPersonalToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
  name?: string | null,
  expiresPreset?: PersonalTokenExpiryPreset | null
): Promise<PersonalTokenRecord> {
  const PRESET_TO_PRISMA: Record<PersonalTokenExpiryPreset, string> = {
    '1_week': 'ONE_WEEK',
    '1_month': 'ONE_MONTH',
    '3_months': 'THREE_MONTHS',
    '6_months': 'SIX_MONTHS',
    '1_year': 'ONE_YEAR',
  };
  const prismaPreset = expiresPreset ? PRESET_TO_PRISMA[expiresPreset] : null;
  const saved: any = await PersonalTokens.create({
    data: {
      users: { connect: { id: userId } },
      token_hash: tokenHash,
      name: name ?? null,
      expires_preset: (prismaPreset ?? null) as any,
      expires_at: expiresAt,
    },
  });
  logger.info(`Personal token created id=${saved.id} for user_id=${userId}`);
  return toPersonalTokenRecord(saved);
}

export async function findValidPersonalToken(userId: number): Promise<PersonalTokenRecord | null> {
  const row: any = await PersonalTokens.findFirst({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: [{ created_at: 'desc' }],
  });
  return row ? toPersonalTokenRecord(row) : null;
}

export async function revokePersonalToken(id: number): Promise<void> {
  await PersonalTokens.update({ where: { id }, data: { revoked_at: new Date() } });
}

export async function listActivePersonalTokens(): Promise<PersonalTokenRecord[]> {
  const rows: any[] = await PersonalTokens.findMany({
    where: {
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: [{ created_at: 'desc' }],
    take: 500,
  });
  return rows.map(toPersonalTokenRecord);
}

export async function listActivePersonalTokensByUserId(userId: number): Promise<PersonalTokenRecord[]> {
  const rows: any[] = await PersonalTokens.findMany({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: [{ created_at: 'desc' }],
    take: 500,
  });
  return rows.map(toPersonalTokenRecord);
}

export async function getPersonalTokenById(id: number): Promise<PersonalTokenRecord | null> {
  const row: any = await PersonalTokens.findUnique({ where: { id } });
  return row ? toPersonalTokenRecord(row) : null;
}

export async function revokePersonalTokenForUser(id: number, userId: number): Promise<boolean> {
  const res = await PersonalTokens.updateMany({ where: { id, user_id: userId }, data: { revoked_at: new Date() } });
  return (res as any)?.count > 0;
}