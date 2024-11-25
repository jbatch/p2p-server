// src/utils/logger.ts
import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
