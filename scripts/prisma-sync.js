const path = require('path');
const { spawnSync } = require('child_process');

require('ts-node/register');

const { getDbSettings, getAppSettings } = require(path.join(process.cwd(), 'src', 'config', 'settings'));
const { setupLogger } = require(path.join(process.cwd(), 'src', 'utils', 'logger'));

const _APP_SETTINGS = getAppSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

const db = getDbSettings();

const user = encodeURIComponent(db.db_user || '');
const pass = encodeURIComponent(db.db_password || '');
const host = db.db_host;
const port = db.db_port;
const name = db.db_name;
const url = `mysql://${user}:${pass}@${host}:${port}/${name}`;

process.env.DATABASE_URL = url;

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status || 1);
  }
}

logger.info(`Pulling schema from DB ${host}:${port}/${name}`);
run('npx', ['prisma', 'db', 'pull']);

logger.info('Generating Prisma client');
run('npx', ['prisma', 'generate']);

logger.info('Done');