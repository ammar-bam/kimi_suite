import { Worker } from "bullmq";
import IORedis from "ioredis";
import { embedJob } from "./jobs/embed";
import { renderPptxJob } from "./jobs/render-pptx";
import { ttsJob } from "./jobs/tts";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn(
    "[worker] REDIS_URL is not set - background worker is idle. Set REDIS_URL in .env to enable job processing."
  );
  // Keep the process alive so `tsx watch` stays running in dev.
  setInterval(() => {}, 1 << 30);
} else {
  startWorker(redisUrl);
}

function startWorker(url: string) {
  const connection = new IORedis(url, {
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
}
