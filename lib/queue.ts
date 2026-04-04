import { Queue } from "bullmq";
import {connection} from "./redis"

export const videoQueue = new Queue("video-queue", {
connection, 
defaultJobOptions: {
    removeOnComplete: true, // IMPORTANT: Saves memory and cleanup commands
    removeOnFail: 1000,
  }
})