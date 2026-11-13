import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const eventsConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const playgroundQueue = new Queue("playground", {
  connection,
});

export const playgroundQueueEvents = new QueueEvents("playground", {
  connection: eventsConnection,
});
