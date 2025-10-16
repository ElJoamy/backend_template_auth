// Re-exporta todo de Prisma Client para reflejar automáticamente nuevos modelos/tipos.
export * from '@prisma/client';

// Re-export del cliente Prisma configurado en la app
export { prisma } from '../../config/db_config';

// Includes comunes (opcionales)
export const includes = {
  userWithRole: { roles: true } as const,
  sessionWithUser: { users: true } as const,
};