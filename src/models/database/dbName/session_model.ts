import { prisma } from '../../../config/db_config';
export { user_sessions } from '@prisma/client';

// Delegate para el modelo 'user_sessions' de Prisma
export const Sessions = prisma.user_sessions;