import { Response } from "express";
import { redis } from "../config/redis.config";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("NotificationService");

interface SSEConnection {
  response: Response;
  userId: string;
  heartbeatInterval: NodeJS.Timeout;
}

const connections = new Map<string, SSEConnection[]>();
const subscribers = new Map<string, any>();

export function addConnection(userId: string, res: Response): string {
  const connectionId = `${userId}-${Date.now()}`;

  const heartbeatInterval = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 30000);

  const connection: SSEConnection = {
    response: res,
    userId,
    heartbeatInterval,
  };

  const userConnections = connections.get(userId) || [];
  userConnections.push(connection);
  connections.set(userId, userConnections);

  if (!subscribers.has(userId)) {
    subscribeToUserChannel(userId);
  }

  log.info("SSE connection added", {
    userId,
    connectionId,
    totalConnections: userConnections.length,
  });

  return connectionId;
}

export function removeConnection(userId: string, res: Response): void {
  const userConnections = connections.get(userId) || [];
  const connectionIndex = userConnections.findIndex(
    (conn) => conn.response === res,
  );

  if (connectionIndex !== -1) {
    const connection = userConnections[connectionIndex];
    clearInterval(connection.heartbeatInterval);
    userConnections.splice(connectionIndex, 1);

    if (userConnections.length === 0) {
      connections.delete(userId);
      unsubscribeFromUserChannel(userId);
    } else {
      connections.set(userId, userConnections);
    }

    log.info("SSE connection removed", {
      userId,
      remainingConnections: userConnections.length,
    });
  }
}

async function subscribeToUserChannel(userId: string): Promise<void> {
  const channel = `notifications:${userId}`;
  const subscriber = redis.duplicate();

  await subscriber.subscribe(channel);

  subscriber.on("message", (receivedChannel, message) => {
    if (receivedChannel === channel) {
      sendToUser(userId, message);
    }
  });

  subscribers.set(userId, subscriber);

  log.info("Subscribed to user notification channel", { userId, channel });
}

async function unsubscribeFromUserChannel(userId: string): Promise<void> {
  const channel = `notifications:${userId}`;
  const subscriber = subscribers.get(userId);

  if (subscriber) {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
    subscribers.delete(userId);

    log.info("Unsubscribed from user notification channel", {
      userId,
      channel,
    });
  }
}

function sendToUser(userId: string, data: string): void {
  const userConnections = connections.get(userId) || [];

  userConnections.forEach((connection) => {
    try {
      connection.response.write(`data: ${data}\n\n`);
    } catch (error: any) {
      log.error("Failed to send SSE message", {
        error: error.message,
        userId,
      });
      removeConnection(userId, connection.response);
    }
  });
}

export function getActiveConnectionsCount(): number {
  let total = 0;
  connections.forEach((userConnections) => {
    total += userConnections.length;
  });
  return total;
}

export function getUserConnectionsCount(userId: string): number {
  const userConnections = connections.get(userId) || [];
  return userConnections.length;
}

export function getStats() {
  return {
    totalConnections: getActiveConnectionsCount(),
    totalUsers: connections.size,
    totalSubscribers: subscribers.size,
  };
}
