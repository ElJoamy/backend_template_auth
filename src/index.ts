import 'reflect-metadata';
import express from 'express';
import { setupLogger } from './utils/logger';
import { addCors } from './config/cors_config';
import { getAppSettings, type AppSettings } from './config/settings';
import { apiRouterV1 } from './routes/api/v1';
import { initDb } from './config/db_config';
import { initOrm } from './config/orm_config';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();
const _APP_SETTINGS: AppSettings = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

app.use(express.json());
// Soporte para formularios URL-encoded (opcional, útil para compatibilidad)
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

// Inicializa DB y luego arranca el servidor
Promise.all([initDb(), initOrm()])
  .then(() => {
    logger.info('DB y ORM inicializados correctamente.');
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error(`No se pudo inicializar la DB/ORM: ${err?.message ?? err}`);
    // Arranca servidor de todas formas (opcional)
    app.listen(port, () => {
      logger.warn(`Server running without full DB/ORM on http://localhost:${port}`);
    });
  });