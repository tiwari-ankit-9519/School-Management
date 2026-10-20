import { Queue, Worker } from "bullmq";
import { generateRecurringFeeBillsService } from "../services/fee-billing.service";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("FeeWorker");

const QUEUE_NAME = "fees";
const JOB_NAME = "generate-fee-bills";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisUrlParsed = new URL(redisUrl);

const bullMQConnection = {
  host: redisUrlParsed.hostname,
  port: parseInt(redisUrlParsed.port || "6379"),
  password: redisUrlParsed.password || undefined,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

const feeQueue = new Queue(QUEUE_NAME, {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

feeQueue.on("error", (error) => {
  log.error("Fee queue error", { error: error.message });
});

export async function startFeeQueue(): Promise<void> {
  await feeQueue.add(
    JOB_NAME,
    { trigger: "schedule" },
    {
      repeat: { pattern: "5 0 * * *", tz: "Asia/Kolkata" },
      jobId: `${JOB_NAME}-recurring`,
    },
  );

  await feeQueue.add(JOB_NAME, { trigger: "startup" });

  log.info("Fee queue started", {
    job: JOB_NAME,
    schedule: "Daily at 00:05 Asia/Kolkata",
  });
}

const feeWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name !== JOB_NAME) return null;

    log.info("Processing fee billing job", {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      trigger: job.data?.trigger ?? "schedule",
    });

    const result = await generateRecurringFeeBillsService();

    log.info("Fee billing job completed", { jobId: job.id, ...result });
    return result;
  },
  { connection: bullMQConnection, concurrency: 1 },
);

feeWorker.on("active", (job) => {
  log.info("Fee worker job started", { jobId: job.id, jobName: job.name });
});

feeWorker.on("completed", (job) => {
  log.info("Fee worker job completed", { jobId: job.id, jobName: job.name });
});

feeWorker.on("failed", (job, error) => {
  log.error("Fee worker job failed", {
    jobId: job?.id,
    jobName: job?.name,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  });
});

feeWorker.on("error", (error) => {
  log.error("Fee worker error", { error: error.message });
});

export { feeQueue };
