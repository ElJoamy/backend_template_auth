import { prisma } from '../../../config/db_config';
export { roles } from '@prisma/client';

// Delegate para el modelo 'roles' de Prisma
export const Roles = prisma.roles;