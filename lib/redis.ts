import IORedis from "ioredis";

export function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is missing!");
  }

  try {
    const parsed = new URL(redisUrl);
    const host = parsed.host;
    console.log(`[Redis Connection] Connecting to Redis host: ${host}`);
  } catch (err) {
    console.log(`[Redis Connection] Connecting to Redis URL (custom format)`);
  }

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}