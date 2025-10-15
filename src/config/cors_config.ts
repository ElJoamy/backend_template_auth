import cors from "cors";
import type { Express } from "express";
import { setupLogger } from "../utils/logger";
import { getAppSettings, getCorsSettings } from "./settings";

const _APP_SETTINGS = getAppSettings();
const _CORS_SETTINGS = getCorsSettings();
const logger = setupLogger(_APP_SETTINGS.log_level);

const allowedOrigins = [
  "http://localhost:8000",
  "http://192.168.232.220:8000",
  "http://localhost:80",
  "http://192.168.232.230:80",
  "http://localhost",
  "http://192.168.232.230",
  "http://localhost:5173",
].map(o => o.replace(/\/$/, ""));

export function addCors(app: Express): void {
  const originCheck: cors.CorsOptions["origin"] = (origin, callback) => {
    if (!origin) return callback(new Error("CORS blocked: missing Origin header"));

    const normalized = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalized)) return callback(null, true);

    callback(new Error(`CORS blocked: origin ${normalized} not allowed`));
  };

  const allowAll = (_CORS_SETTINGS.allowed_origins || "all").toLowerCase() === "all";

  const corsOptions: cors.CorsOptions = {
    origin: allowAll ? true : originCheck,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  if (allowAll) {
    logger.info("CORS mode 'all': any Origin allowed");
  } else {
    logger.info(`CORS mode 'limited': allowed -> ${allowedOrigins.join(", ")}`);
  }
}
