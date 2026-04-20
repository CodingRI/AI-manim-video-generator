import { Queue } from "bullmq";
import { createRedisConnection } from "./redis";

export const videoQueue = new Queue("video-queue", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000,
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});