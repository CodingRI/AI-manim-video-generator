import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export async function setOTP(email: string, otp: string) {

  await redis.set(`otp:${email}`, otp, "EX", 60);

  await redis.set(`otp_attempts:${email}`, 0, "EX", 60);
}

export async function getOTP(email: string) {
  return redis.get(`otp:${email}`);
}

export async function incrementAttempts(email: string) {
  const attempts = await redis.incr(`otp_attempts:${email}`);
  return attempts;
}

export async function deleteOTP(email: string) {
  await redis.del(`otp:${email}`);
  await redis.del(`otp_attempts:${email}`);
}