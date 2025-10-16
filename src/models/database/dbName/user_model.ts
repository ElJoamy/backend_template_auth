import { prisma } from '../../../config/db_config';
export { users } from '@prisma/client';

// Delegate para el modelo 'users' de Prisma
export const Users = prisma.users;