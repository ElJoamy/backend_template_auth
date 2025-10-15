import mysql from "mysql2/promise";
import { setupLogger } from "../utils/logger";
import { AppSettings, getAppSettings, getDbSettings, type DbSettings } from "./settings";

const _DB_SETTINGS: DbSettings = getDbSettings();
const _APP_SETTINGS: AppSettings = getAppSettings();

// Logger por archivo
const logger = setupLogger(_APP_SETTINGS.log_level);

// Pool de conexiones para múltiples usuarios
export const dbPool = mysql.createPool({
  host: _DB_SETTINGS.db_host,
  user: _DB_SETTINGS.db_user,
  password: _DB_SETTINGS.db_password,
  port: _DB_SETTINGS.db_port,
  database: _DB_SETTINGS.db_name,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 50)
});

export async function initDb(): Promise<void> {
  try {
    // Asegura que la base de datos exista antes de abrir el pool
    const bootstrapConn = await mysql.createConnection({
      host: _DB_SETTINGS.db_host,
      user: _DB_SETTINGS.db_user,
      password: _DB_SETTINGS.db_password,
      port: _DB_SETTINGS.db_port,
      multipleStatements: false,
    });
    await bootstrapConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${_DB_SETTINGS.db_name}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
    await bootstrapConn.end();

    const conn = await dbPool.getConnection();
    await conn.ping();
    conn.release();
    logger.info(
      `MySQL pool inicializado en DB=${_DB_SETTINGS.db_name}`
    );
  } catch (err) {
    logger.error(`Error conectando a MySQL: ${(err as Error).message}`);
    throw err;
  }
}

export async function closeDb(): Promise<void> {
  try {
    await dbPool.end();
    logger.info("MySQL pool cerrado correctamente");
  } catch (err) {
    logger.error(`Error cerrando el pool: ${(err as Error).message}`);
  }
}