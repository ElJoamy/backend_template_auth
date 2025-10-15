import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { setupLogger } from '../utils/logger';
import { getAppSettings, getDbSettings, type AppSettings, type DbSettings } from './settings';
import { User } from '../models/database/dbName/user_model';
import { Role } from '../models/database/dbName/role_model';
import { Session } from '../models/database/dbName/session_model';

const _APP_SETTINGS: AppSettings = getAppSettings();
const _DB_SETTINGS: DbSettings = getDbSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: _DB_SETTINGS.db_host,
  port: _DB_SETTINGS.db_port,
  username: _DB_SETTINGS.db_user,
  password: _DB_SETTINGS.db_password,
  database: _DB_SETTINGS.db_name,
  entities: [User, Role, Session],
  synchronize: false,
  logging: false,
});

let initialized = false;
export async function initOrm(): Promise<void> {
  if (initialized) return;
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info(`TypeORM initialized on DB=${_DB_SETTINGS.db_name}`);
    try {
      await AppDataSource.synchronize();
      logger.info('Schema synchronized: tables created/updated according to entities.');
    } catch (err) {
      logger.error(`Failed to synchronize schema: ${(err as Error).message}`);
      throw err;
    }
  }
  initialized = true;
}