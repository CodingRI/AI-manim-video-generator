import { Queue } from "bullmq";
import {connection} from "./redis"

export const videoQueue = new Queue("video-queue", {
connection, 
})