// src/config/index.ts
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3001"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAX_ROOMS: z.string().default("1000"),
  ROOM_TIMEOUT_MS: z.string().default("3600000"), // 1 hour
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("Invalid environment variables:", error);
    process.exit(1);
  }
};

export const config = parseEnv();
