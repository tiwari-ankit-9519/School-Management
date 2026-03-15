import Redis from "ioredis";
import { createModuleLogger, logSecurityEvent } from "./logger.config";

const log = createModuleLogger("RedisService");
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

if (!process.env.REDIS_URL) {
  log.warn("REDIS_URL not set, falling back to localhost:6379");
}

const redisUrlParsed = new URL(redisUrl);

const sharedRedisOptions = {
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  retryStrategy(times: number) {
    if (times > 20) {
      log.error("Redis max retry attempts reached, giving up", {
        attempts: times,
        redisUrl: redisUrl.replace(/:\/\/.*@/, "://[credentials]@"),
      });
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    log.warn("Redis connection retry attempt", {
      attempts: times,
      delayMs: delay,
      nextRetryAt: new Date(Date.now() + delay).toISOString(),
    });
    return delay;
  },
  reconnectOnError(err: Error) {
    const reconnectErrors = ["READONLY", "ECONNRESET", "ECONNREFUSED"];
    const shouldReconnect = reconnectErrors.some((tar) =>
      err.message.includes(tar),
    );
    if (shouldReconnect) {
      log.error("Redis reconnectable error detected", {
        error: err.message,
        triggeredReconnect: true,
      });
      return true as const;
    }
    return false as const;
  },
};

export const redis = new Redis(redisUrl, sharedRedisOptions);

export const redisConnection = new Redis(redisUrl, sharedRedisOptions);

redis.on("connect", () => {
  log.info("Redis connection established", {
    host: redisUrlParsed.hostname,
    port: redisUrlParsed.port,
  });
});

redis.on("ready", () => {
  log.info("Redis client ready to accept commands");
});

redis.on("error", (error: Error & { code?: string }) => {
  log.error("Redis connection error", {
    error: error.message,
    code: error.code,
    stack:
      process.env.ENABLE_ERROR_STACK_TRACE === "true" ? error.stack : undefined,
  });
  if (
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ENOTFOUND")
  ) {
    logSecurityEvent("REDIS_CONNECTION_FAILURE", "internal", null, {
      error: error.message,
      host: redisUrlParsed.hostname,
      port: redisUrlParsed.port,
    });
  }
});

redis.on("close", () => {
  log.warn("Redis connection closed");
});

redis.on("reconnecting", (delay: string) => {
  log.info("Redis attempting to reconnect", { delayMs: delay });
});

redis.on("end", () => {
  log.warn("Redis connection ended and will not reconnect");
});

redis.on("wait", () => {
  log.debug("Redis client waiting for connection");
});

redisConnection.on("connect", () => {
  log.debug("BullMQ Redis connection established");
});

redisConnection.on("error", (error: Error) => {
  log.error("BullMQ Redis connection error", { error: error.message });
});

export async function connectRedis() {
  try {
    const pingResult = await redis.ping();
    if (pingResult !== "PONG") {
      throw new Error(`Unexpected ping response: ${pingResult}`);
    }
    log.info("Redis ping successful");

    const serverInfo = await redis.info("server");
    const statsInfo = await redis.info("stats");
    const memoryInfo = await redis.info("memory");

    const version = serverInfo.match(/redis_version:([^\r\n]+)/)?.[1]?.trim();
    const mode = serverInfo.match(/redis_mode:([^\r\n]+)/)?.[1]?.trim();
    const os = serverInfo.match(/os:([^\r\n]+)/)?.[1]?.trim();
    const uptimeSeconds = serverInfo.match(/uptime_in_seconds:([^\r\n]+)/)?.[1]?.trim();
    const connectedClients = serverInfo.match(/connected_clients:([^\r\n]+)/)?.[1]?.trim();
    const usedMemory = memoryInfo.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim();
    const totalCommandsProcessed = statsInfo.match(/total_commands_processed:([^\r\n]+)/)?.[1]?.trim();

    log.info("Redis server info", {
      version,
      mode,
      os,
      uptimeSeconds: uptimeSeconds ? parseInt(uptimeSeconds) : undefined,
      connectedClients: connectedClients ? parseInt(connectedClients) : undefined,
      usedMemory,
      totalCommandsProcessed: totalCommandsProcessed ? parseInt(totalCommandsProcessed) : undefined,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to connect to Redis", {
      error: err.message,
      stack:
        process.env.ENABLE_ERROR_STACK_TRACE === "true" ? err.stack : undefined,
    });
    throw error;
  }
}

export async function disconnectRedis() {
  try {
    await Promise.all([redis.quit(), redisConnection.quit()]);
    log.info("Redis disconnected gracefully");
  } catch (error) {
    const err = error as Error;
    log.error("Error disconnecting Redis", {
      error: err.message,
      stack:
        process.env.ENABLE_ERROR_STACK_TRACE === "true" ? err.stack : undefined,
    });
  }
}

export async function checkRedisConnection() {
  try {
    const result = await redis.ping();
    const isConnected = result === "PONG";
    log.debug("Redis health check", { isConnected, response: result });
    return isConnected;
  } catch (error) {
    const err = error as Error;
    log.error("Redis health check failed", { error: err.message });
    return false;
  }
}

export async function getRedisStats() {
  try {
    const info = await redis.info();
    const dbSize = await redis.dbsize();

    const usedMemory = info.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim();
    const connectedClients = info.match(/connected_clients:([^\r\n]+)/)?.[1]?.trim();
    const totalCommandsProcessed = info.match(/total_commands_processed:([^\r\n]+)/)?.[1]?.trim();
    const keyspaceHits = info.match(/keyspace_hits:([^\r\n]+)/)?.[1]?.trim();
    const keyspaceMisses = info.match(/keyspace_misses:([^\r\n]+)/)?.[1]?.trim();
    const uptimeSeconds = info.match(/uptime_in_seconds:([^\r\n]+)/)?.[1]?.trim();

    const hits = parseInt(keyspaceHits || "0");
    const misses = parseInt(keyspaceMisses || "0");
    const hitRate =
      hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : "0.00";

    const stats = {
      dbSize,
      usedMemory,
      connectedClients: connectedClients ? parseInt(connectedClients) : 0,
      totalCommandsProcessed: totalCommandsProcessed ? parseInt(totalCommandsProcessed) : 0,
      keyspaceHits: hits,
      keyspaceMisses: misses,
      hitRatePercent: parseFloat(hitRate),
      uptimeSeconds: uptimeSeconds ? parseInt(uptimeSeconds) : 0,
    };

    log.debug("Redis stats retrieved", stats);
    return stats;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to retrieve Redis stats", { error: err.message });
    return null;
  }
}

process.on("SIGINT", async () => {
  log.info("SIGINT received - shutting down Redis connection");
  await disconnectRedis();
});

process.on("SIGTERM", async () => {
  log.info("SIGTERM received - shutting down Redis connection");
  await disconnectRedis();
});