import { PrismaClient } from "@prisma/client";
import { setupLogger } from "../utils/logger";
import { AppSettings, getAppSettings, getDbSettings, type DbSettings } from "./settings";

const _DB_SETTINGS: DbSettings = getDbSettings();
const _APP_SETTINGS: AppSettings = getAppSettings();

const logger = setupLogger(_APP_SETTINGS.log_level);

function buildMysqlUrl(db: DbSettings): string {
  const user = encodeURIComponent(db.db_user || "");
  const pass = encodeURIComponent(db.db_password || "");
  const host = db.db_host;
  const port = db.db_port;
  const name = db.db_name;
  return `mysql://${user}:${pass}@${host}:${port}/${name}`;
}

const DATABASE_URL = process.env.DATABASE_URL || buildMysqlUrl(_DB_SETTINGS);

export const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

export async function initDb(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info(`Prisma conectado a MySQL DB=${_DB_SETTINGS.db_name}`);
  } catch (err) {
    logger.error(`Error conectando a MySQL con Prisma: ${(err as Error).message}`);
    throw err;
  }
}

export async function closeDb(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Prisma desconectado de MySQL correctamente");
  } catch (err) {
    logger.error(`Error cerrando conexión Prisma: ${(err as Error).message}`);
  }
}