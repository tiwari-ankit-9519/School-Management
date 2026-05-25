import { Queue, Worker } from "bullmq";
import { expireSlotOffersService } from "../services/admission.service";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("AdmissionWorker");

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

const admissionQueue = new Queue("admission", {
  connection: bullMQConnection,
});

admissionQueue.on("error", (error) => {
  log.error("Admission queue error", { error: error.message });
});

export async function startAdmissionQueue(): Promise<void> {
  await admissionQueue.add(
    "expire-slot-offers",
    {},
    {
      repeat: {
        every: 60 * 60 * 1000,
      },
      jobId: "expire-slot-offers-recurring",
    },
  );
  log.info("Admission queue started", {
    job: "expire-slot-offers",
    intervalHours: 1,
  });
}

const admissionWorker = new Worker(
  "admission",
  async (job) => {
    if (job.name === "expire-slot-offers") {
      log.info("Processing expire-slot-offers job", {
        jobId: job.id,
        attemptsMade: job.attemptsMade,
      });
      await expireSlotOffersService();
      log.info("Expire-slot-offers job completed successfully", {
        jobId: job.id,
      });
    }
  },
  { connection: bullMQConnection },
);

admissionWorker.on("active", (job) => {
  log.info("Admission worker job started", {
    jobId: job.id,
    jobName: job.name,
  });
});

admissionWorker.on("completed", (job) => {
  log.info("Admission worker job completed", {
    jobId: job.id,
    jobName: job.name,
  });
});

admissionWorker.on("failed", (job, error) => {
  log.error("Admission worker job failed", {
    jobId: job?.id,
    jobName: job?.name,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  });
});

admissionWorker.on("error", (error) => {
  log.error("Admission worker error", { error: error.message });
});

export { admissionQueue };
