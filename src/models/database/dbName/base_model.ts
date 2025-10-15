import { BaseEntity } from 'typeorm';
import { setupLogger } from '../../../utils/logger';
import type { AppSettings } from '../../../config/settings';
import { getAppSettings } from '../../../config/settings';

const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

export abstract class BaseModel extends BaseEntity {}

logger.info('BaseModel loaded: ready to declare entities.');