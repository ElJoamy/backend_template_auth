import mysql from "mysql2/promise";
import { setupLogger } from "../utils/logger";
import { AppSettings, getAppSettings, getDbSettings, type DbSettings } from "./settings";

const _DB_SETTINGS: DbSettings = getDbSettings();
const _APP_SETTINGS: AppSettings = getAppSettings();

const logger = setupLogger(_APP_SETTINGS.log_level);

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
      `MySQL pool initialized on DB=${_DB_SETTINGS.db_name}`
    );
  } catch (err) {
    logger.error(`Error connecting to MySQL: ${(err as Error).message}`);
    throw err;
  }
}

export async function closeDb(): Promise<void> {
  try {
    await dbPool.end();
    logger.info("MySQL pool closed successfully");
  } catch (err) {
    logger.error(`Error closing pool: ${(err as Error).message}`);
  }
}