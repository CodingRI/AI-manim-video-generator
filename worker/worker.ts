import { Worker } from "bullmq";
import { connection } from "@/lib/redis";
import { runPipeline } from "./pipeline";
import { prisma } from "@/lib/prisma";

const worker = new Worker(
  "video-queue",
  async (job) => {
    const { jobId } = job.data;
    console.log("Processing job:", jobId);
    try {
      await prisma.videoJob.update({
        where: { id: jobId },
        data: { status: "processing" },
      });

      const result = await runPipeline(job.data);

      await prisma.videoJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          videoUrl: result.videoUrl,
        },
      });
      console.log("Job completed:", jobId);

      console.log("Final video", result);

    } catch (err) {
      console.error(err);

      await prisma.videoJob.update({
        where: { id: jobId },
        data: { status: "failed" },
      });
    }
  },
  { connection }
);