import { BaseEntity } from 'typeorm';
import { setupLogger } from '../../../utils/logger';
import type { AppSettings } from '../../../config/settings';
import { getAppSettings } from '../../../config/settings';

// Logger por archivo
const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

// Clase base para entidades TypeORM, similar a DeclarativeBase de SQLAlchemy
export abstract class BaseModel extends BaseEntity {}

logger.info('BaseModel cargado: listo para declarar entidades.');