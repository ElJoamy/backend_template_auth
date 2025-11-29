import { setupLogger } from '../../utils/logger';
import { getAppSettings, type AppSettings } from '../../config/settings';
import { prisma } from '../../config/db_config';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);
// Usar el cliente Prisma compartido de la app

export interface TwoFactorRecord {
  id: number;
  user_id: number;
  secret: string;
  algorithm: 'sha1' | 'sha256' | 'sha512';
  digits: number;
  period: number;
  issuer: string | null;
  label: string | null;
  is_enabled: boolean;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function getTwoFactorByUserId(userId: number): Promise<TwoFactorRecord | null> {
  try {
    const record = await prisma.userTwoFactor.findUnique({
      where: { user_id: userId }
    });
    
    if (!record) return null;
    
    return {
      id: record.id,
      user_id: record.user_id,
      secret: record.secret,
      algorithm: record.algorithm as 'sha1' | 'sha256' | 'sha512',
      digits: record.digits,
      period: record.period,
      issuer: record.issuer,
      label: record.label,
      is_enabled: record.is_enabled,
      confirmed_at: record.confirmed_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  } catch (error: any) {
    logger.error(`Error getting 2FA record for user ${userId}: ${error?.message ?? error}`);
    return null;
  }
}

export async function createTwoFactorRecord(
  userId: number,
  secret: string,
  algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha1',
  digits: number = 6,
  period: number = 30,
  issuer?: string,
  label?: string
): Promise<TwoFactorRecord | null> {
  try {
    const record = await prisma.userTwoFactor.create({
      data: {
        user_id: userId,
        secret,
        algorithm,
        digits,
        period,
        issuer,
        label,
        is_enabled: false,
        confirmed_at: null,
      }
    });

    logger.info(`2FA record created for user ${userId}`);
    
    return {
      id: record.id,
      user_id: record.user_id,
      secret: record.secret,
      algorithm: record.algorithm as 'sha1' | 'sha256' | 'sha512',
      digits: record.digits,
      period: record.period,
      issuer: record.issuer,
      label: record.label,
      is_enabled: record.is_enabled,
      confirmed_at: record.confirmed_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  } catch (error: any) {
    logger.error(`Error creating 2FA record for user ${userId}: ${error?.message ?? error}`);
    return null;
  }
}

export async function updateTwoFactorRecord(
  userId: number,
  updates: {
    secret?: string;
    algorithm?: 'sha1' | 'sha256' | 'sha512';
    digits?: number;
    period?: number;
    issuer?: string;
    label?: string;
    is_enabled?: boolean;
    confirmed_at?: Date | null;
  }
): Promise<boolean> {
  try {
    await prisma.userTwoFactor.update({
      where: { user_id: userId },
      data: {
        ...updates,
        updated_at: new Date(),
      }
    });

    logger.info(`2FA record updated for user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error updating 2FA record for user ${userId}: ${error?.message ?? error}`);
    return false;
  }
}

export async function deleteTwoFactorRecord(userId: number): Promise<boolean> {
  try {
    await prisma.userTwoFactor.delete({
      where: { user_id: userId }
    });

    logger.info(`2FA record deleted for user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error deleting 2FA record for user ${userId}: ${error?.message ?? error}`);
    return false;
  }
}

export async function enableTwoFactor(userId: number): Promise<boolean> {
  try {
    await prisma.userTwoFactor.update({
      where: { user_id: userId },
      data: {
        is_enabled: true,
        confirmed_at: new Date(),
        updated_at: new Date(),
      }
    });

    logger.info(`2FA enabled for user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error enabling 2FA for user ${userId}: ${error?.message ?? error}`);
    return false;
  }
}

export async function disableTwoFactor(userId: number): Promise<boolean> {
  try {
    await prisma.userTwoFactor.update({
      where: { user_id: userId },
      data: {
        is_enabled: false,
        updated_at: new Date(),
      }
    });

    logger.info(`2FA disabled for user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error disabling 2FA for user ${userId}: ${error?.message ?? error}`);
    return false;
  }
}