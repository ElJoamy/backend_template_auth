import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export interface AppSettings {
  service_name: string;
  version: string;
  log_level: string;
  port: number;
}

export interface DbSettings {
  db_host: string;
  db_user: string;
  db_password: string;
  db_port: number;
  db_name: string;
}

export interface JwtSettings {
  jwt_secret: string;
  jwt_algorithm: string;
  jwt_expiration_minutes: number;
  jwt_refresh_expiration_minutes: number;
  jwt_issuer: string;
  jwt_audience: string;
}

export interface CorsSettings {
  allowed_origins: string;
}

export interface UserSettings {
  service_user: string;
  service_user_pass: string;
  service_user_email: string;
}

export interface Settings {
  app: AppSettings;
  db: DbSettings;
  jwt: JwtSettings;
  cors: CorsSettings;
  user_admin: UserSettings;
}

let cachedSettings: Settings | null = null;

export function getSettings(): Settings {
  if (cachedSettings) return cachedSettings;

  const env = process.env;

  const strOrDefault = (val: string | undefined, def: string): string => {
    const v = (val ?? '').trim();
    return v.length > 0 ? v : def;
  };

  const settings: Settings = {
    app: {
      service_name: env.SERVICE_NAME ?? "Backend Template Auth - Typescrypt",
      version: env.K_REVISION ?? "local",
      log_level: env.LOG_LEVEL ?? "DEBUG",
      port: env.PORT ? Number(env.PORT) : 3000,
    },
    db: {
      db_host: env.DB_HOST ?? "localhost",
      db_user: env.DB_USER ?? "root",
      db_password: env.DB_PASSWORD ?? "root",
      db_port: env.DB_PORT ? Number(env.DB_PORT) : 3306,
      db_name: env.DB_NAME ?? "dbtest",
    },
    jwt: {
      jwt_secret: env.JWT_SECRET ?? "changeme",
      jwt_algorithm: env.JWT_ALGORITHM ?? "HS256",
      jwt_expiration_minutes: env.JWT_EXPIRATION_MINUTES ? Number(env.JWT_EXPIRATION_MINUTES) : 60,
      jwt_refresh_expiration_minutes: env.JWT_REFRESH_EXPIRATION_MINUTES ? Number(env.JWT_REFRESH_EXPIRATION_MINUTES) : 20160, // 14 días
      jwt_issuer: env.JWT_ISSUER ?? "backend-template-auth-api",
      jwt_audience: env.JWT_AUDIENCE ?? "backend-template-auth-client",
    },
    cors: {
      allowed_origins: env.ALLOWED_ORIGINS ?? "all",
    },
    user_admin: {
      service_user: strOrDefault(env.SERVICE_USER, "admin"),
      service_user_pass: strOrDefault(env.SERVICE_USER_PASS, "AdminPassword159@!"),
      service_user_email: strOrDefault(env.SERVICE_USER_EMAIL, "admin@example.com"),
    },
  };

  cachedSettings = settings;
  return settings;
}

export function getAppSettings(): AppSettings {
  return getSettings().app;
}

export function getDbSettings(): DbSettings {
  return getSettings().db;
}

export function getJwtSettings(): JwtSettings {
  return getSettings().jwt;
}

export function getCorsSettings(): CorsSettings {
  return getSettings().cors;
}

export function getUserAdminSettings(): UserSettings {
  return getSettings().user_admin;
}

const settings = getSettings();

export default settings;