import { prisma } from '../../../config/db_config';
import type { PrismaClient } from '@prisma/client';

// Db expone el Prisma Client ya configurado.
// Al agregar nuevas tablas y regenerar Prisma, `Db.<modelo>` aparecerá automáticamente tipado.
export const Db: PrismaClient = prisma as PrismaClient;