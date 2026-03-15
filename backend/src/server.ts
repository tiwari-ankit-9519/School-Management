import "dotenv/config";
import { createServer } from "http";
import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "@/src/config/database.config";
import { connectRedis, disconnectRedis } from "./config/redis.config";
import { createModuleLogger, logSystemStartup, logSystemShutdown } from "./config/logger.config";

const log = createModuleLogger("Server");
const PORT = parseInt(process.env.PORT ?? "5000");
const HOST = process.env.HOST ?? "0.0.0.0";
const httpServer = createServer(app);

interface NodeError extends Error {
  code?: string;
}

async function startServer(): Promise<void> {
  try {
    logSystemStartup();
    log.info("Connecting to database...");
    await connectDatabase();
    log.info("Connecting to Redis...");
    await connectRedis();
    await import("./workers/email.worker");
    log.info("Email worker started");
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(PORT, HOST, () => {
        resolve();
      });
      httpServer.once("error", (error: NodeError) => {
        if (error.code === "EADDRINUSE") {
          log.error("Port already in use", { port: PORT });
        }
        reject(error);
      });
    });
    log.info("Server started successfully", {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV,
      apiPrefix: process.env.API_PREFIX ?? "/api/v1",
      pid: process.pid,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to start server", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  log.info("SIGTERM received - shutting down gracefully");
  httpServer.close();
  await disconnectDatabase();
  await disconnectRedis();
  logSystemShutdown("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", async () => {
  log.info("SIGINT received - shutting down gracefully");
  httpServer.close();
  await disconnectDatabase();
  await disconnectRedis();
  logSystemShutdown("SIGINT");
  process.exit(0);
});

process.on("uncaughtException", (error: Error) => {
  log.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  log.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

startServer();