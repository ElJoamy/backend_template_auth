import { prisma } from '../../../config/db_config';
export { user_recovery_codes } from '@prisma/client';

// Delegate para el modelo 'user_recovery_codes' de Prisma
export const RecoveryCodes = prisma.user_recovery_codes;