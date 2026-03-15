import { Worker } from "bullmq";
import { redisConnection } from "@/src/config/redis.config";
import { emailTransporter } from "@/src/config/email.config";
import { createModuleLogger, logSecurityEvent } from "@/src/config/logger.config";
import type { EmailJob } from "@/src/queues/email.queue";

const log = createModuleLogger("EmailWorker");

export const emailWorker = new Worker<EmailJob>(
  "email",
  async (job) => {
    log.info("Processing email job", {
      jobId: job.id,
      to: job.data.to,
      subject: job.data.subject,
      attemptsMade: job.attemptsMade,
    });

    const info = await emailTransporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: Array.isArray(job.data.to) ? job.data.to.join(", ") : job.data.to,
      subject: job.data.subject,
      text: job.data.text,
      html: job.data.html,
    });

    log.info("Email sent successfully", {
      jobId: job.id,
      messageId: info.messageId,
      to: job.data.to,
      subject: job.data.subject,
    });
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  log.info("Email job completed", {
    jobId: job.id,
    to: job.data.to,
    subject: job.data.subject,
  });
});

emailWorker.on("failed", (job, error) => {
  log.error("Email job failed", {
    jobId: job?.id,
    to: job?.data.to,
    subject: job?.data.subject,
    error: error.message,
    attemptsMade: job?.attemptsMade,
    maxAttempts: job?.opts.attempts,
  });

  const isLastAttempt =
    job?.attemptsMade === job?.opts.attempts;

  if (isLastAttempt) {
    logSecurityEvent("EMAIL_JOB_PERMANENTLY_FAILED", "internal", null, {
      jobId: job?.id,
      to: job?.data.to,
      subject: job?.data.subject,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  }
});

emailWorker.on("error", (error) => {
  log.error("Email worker error", { error: error.message });
  logSecurityEvent("EMAIL_WORKER_ERROR", "internal", null, {
    error: error.message,
  });
});

process.on("SIGTERM", async () => {
  log.info("SIGTERM received - closing email worker");
  await emailWorker.close();
});

process.on("SIGINT", async () => {
  log.info("SIGINT received - closing email worker");
  await emailWorker.close();
});