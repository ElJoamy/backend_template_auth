import 'reflect-metadata';
import express from 'express';
import { setupLogger } from './utils/logger';
import { addCors } from './config/cors_config';
import { getAppSettings, type AppSettings } from './config/settings';
import { apiRouterV1 } from './routes/api/v1';
import { initDb } from './config/db_config';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { ensureDefaultRoles } from './services/auth/roles_seed';
import { ensureAdminUser } from './services/auth/admin_seed';

const app = express();
const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
addCors(app);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/v1', apiRouterV1);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const { port } = _APP_SETTINGS;

initDb()
  .then(async () => {
    logger.info('DB initialized successfully.');
    await ensureDefaultRoles();
    await ensureAdminUser();
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error(`Failed to initialize DB: ${err?.message ?? err}`);
    app.listen(port, () => {
      logger.warn(`Server running without full DB on http://localhost:${port}`);
    });
  });