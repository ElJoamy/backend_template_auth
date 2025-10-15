import { setupLogger } from './logger';
import type { AppSettings } from '../config/settings';
import { getAppSettings } from '../config/settings';
import { ValidationError } from './errors';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

function isSequential(digits: string): boolean {
  if (!digits || digits.length < 2) return false;
  let asc = true;
  for (let i = 0; i < digits.length - 1; i++) {
    if (Number(digits[i]) + 1 !== Number(digits[i + 1])) {
      asc = false;
      break;
    }
  }
  if (asc) return true;

  for (let i = 0; i < digits.length - 1; i++) {
    if (Number(digits[i]) - 1 !== Number(digits[i + 1])) {
      return false;
    }
  }
  return true;
}

export function validatePhoneNumber(value: string): string {
  const cleaned = (value ?? '').trim();
  if (!/^\d{6,15}$/.test(cleaned)) {
    logger.warn(`❌ Invalid phone number: ${value}`);
    throw new ValidationError(
      'Phone number must be between 6 and 15 digits, without spaces or symbols.'
    );
  }
  return cleaned;
}

export function validateEmail(value: string): string {
  const cleaned = (value ?? '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new ValidationError('Email inválido.');
  }
  return cleaned;
}

export function validateUsername(value: string): string {
  const cleaned = (value ?? '').trim();
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  if (!usernameRegex.test(cleaned)) {
    throw new ValidationError('Username inválido (3-20, letras/números/._-).');
  }
  return cleaned;
}

export function validatePasswordStrength(value: string): string {
  const pwd = value ?? '';
  if (pwd.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(pwd)) {
    throw new ValidationError('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(pwd)) {
    throw new ValidationError('Password must contain at least one lowercase letter.');
  }
  if (!/\d/.test(pwd)) {
    throw new ValidationError('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-]/.test(pwd)) {
    throw new ValidationError('Password must contain at least one special character.');
  }

  const digitGroups = pwd.match(/\d+/g) || [];
  for (const group of digitGroups) {
    if (group.length >= 3 && isSequential(group)) {
      throw new ValidationError('Password must not contain sequential digits (e.g., 123 or 987).');
    }
  }

  return pwd;
}