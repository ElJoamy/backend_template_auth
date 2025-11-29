import { prisma } from '../../../config/db_config';
export { personal_access_tokens } from '@prisma/client';

// Delegate para el modelo 'personal_access_tokens' de Prisma
export const PersonalTokens = prisma.personal_access_tokens;