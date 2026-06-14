import { Worker } from "bullmq";
import IORedis from "ioredis";
import { embedJob } from "./jobs/embed";
import { renderPptxJob } from "./jobs/render-pptx";
import { ttsJob } from "./jobs/tts";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required for worker runtime");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "kimi-jobs",
  async (job) => {
    if (job.name === "render-pptx") {
      return renderPptxJob(job.data);
    }

    if (job.name === "tts") {
      return ttsJob(job.data);
    }

    if (job.name === "embed") {
      return embedJob(job.data);
    }

    throw new Error(`Unknown job: ${job.name}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[worker] completed ${job.id} (${job.name})`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed ${job?.id} (${job?.name}):`, err.message);
});

console.log("Kimi worker started and listening on queue: kimi-jobs");
