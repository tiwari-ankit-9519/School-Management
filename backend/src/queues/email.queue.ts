import { Queue } from "bullmq";
import { redisConnection } from "@/src/config/redis.config";
import { createModuleLogger, logSecurityEvent } from "@/src/config/logger.config";

const log = createModuleLogger("EmailQueue");

const MAX_RECIPIENTS = 50;

export interface EmailJob {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  priority?: number;
}

export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

emailQueue.on("error", (error) => {
  log.error("Email queue error", { error: error.message });
  logSecurityEvent("EMAIL_QUEUE_ERROR", "internal", null, {
    error: error.message,
  });
});

export async function addEmailToQueue(data: EmailJob) {
  const recipientCount = Array.isArray(data.to) ? data.to.length : 1;

  if (recipientCount > MAX_RECIPIENTS) {
    logSecurityEvent("EMAIL_BULK_SEND_ATTEMPT", "internal", null, {
      recipientCount,
      subject: data.subject,
    });
    throw new Error(
      `Recipient count ${recipientCount} exceeds maximum allowed ${MAX_RECIPIENTS}`,
    );
  }

  try {
    const job = await emailQueue.add("send-email", data, {
      priority: data.priority ?? 5,
    });

    log.debug("Email job added to queue", {
      jobId: job.id,
      to: data.to,
      subject: data.subject,
      recipientCount,
    });

    return job;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to add email to queue", {
      error: err.message,
      to: data.to,
      subject: data.subject,
      recipientCount,
    });
    logSecurityEvent("EMAIL_QUEUE_ADD_FAILED", "internal", null, {
      error: err.message,
      recipientCount,
      subject: data.subject,
    });
    throw err;
  }
}