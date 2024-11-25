// src/index.ts
import { createSignalingServer } from "./server";
import { config } from "./config";
import { logger } from "./utils/logger";

const start = async () => {
  try {
    const server = createSignalingServer();

    server.listen(config.PORT, () => {
      logger.info(
        { port: config.PORT, env: config.NODE_ENV },
        "🚀 Signaling server is running"
      );
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info("Shutting down gracefully...");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

start();
