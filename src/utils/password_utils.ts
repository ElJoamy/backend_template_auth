import argon2 from 'argon2';
import { setupLogger } from './logger';
import type { AppSettings } from '../config/settings';
import { getAppSettings } from '../config/settings';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export async function hashPassword(password: string): Promise<string> {
  const hashed = await argon2.hash(password);
  logger.debug('Password hashed successfully.');
  return hashed;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    const result = await argon2.verify(hashedPassword, plainPassword);
    if (result) {
      logger.debug('Password verified correctly.');
      return true;
    }
    logger.warn('Password verification failed: mismatch.');
    return false;
  } catch (e: any) {
    logger.error(`Unexpected error during password verification: ${e?.message ?? e}`);
    return false;
  }
}