import fs from "fs";
import path from "path";
import winston from "winston";
import chalk from "chalk";

function getCallerFile(): string {
  const stack = new Error().stack?.split("\n") || [];
  const callerLine = stack.find(line => !line.includes("logger.ts") && line.includes(path.sep));
  if (!callerLine) return "unknown";
  const match = callerLine.match(/\((.*):\d+:\d+\)/) || callerLine.match(/at (.*):\d+:\d+/);
  return match ? path.basename(match[1]) : "unknown";
}

export function setupLogger(
  level: winston.LoggerOptions["level"] = "info",
  customFile?: string
): winston.Logger {
  const callerFile = getCallerFile().replace(/\.[jt]s$/, "");
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const logFile = customFile || `${callerFile}.log`;
  const logPath = path.join(logsDir, logFile);

  const colorizeLevel = (lvl: string) => {
    switch (lvl) {
      case "error": return chalk.red.bold(lvl.toUpperCase());
      case "warn": return chalk.yellow.bold(lvl.toUpperCase());
      case "info": return chalk.cyan.bold(lvl.toUpperCase());
      case "debug": return chalk.green.bold(lvl.toUpperCase());
      default: return chalk.white(lvl.toUpperCase());
    }
  };

  const normalizedLevel = (level || "info").toString().toLowerCase() as winston.LoggerOptions["level"];
  const logger = winston.createLogger({
    level: normalizedLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} - ${callerFile} - ${level.toUpperCase()} - ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({
        filename: logPath,
        level: normalizedLevel,
        options: { encoding: "utf-8" }, // 👈 fuerza UTF-8 para evitar errores con tildes, etc.
      }),
      new winston.transports.Console({
        level: normalizedLevel,
        format: winston.format.printf(({ timestamp, level, message }) => {
          return `${chalk.gray(timestamp)} - ${chalk.blue(callerFile)} - ${colorizeLevel(level)} - ${message}`;
        }),
      }),
    ],
  });

  return logger;
}
