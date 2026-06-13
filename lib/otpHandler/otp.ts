import { createRedisConnection } from "../redis";

const redis = createRedisConnection();
export async function canSendOTP(email: string) {
    const key = `otp_cooldown:${email}`;
    const exists = await redis.get(key);
  
    if (exists) return false;
  
    await redis.set(key, "1", "EX", 60); 
    return true;
  }

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

export async function setSignupData(email: string, data: any) {
  await redis.set(`signup:${email}`, JSON.stringify(data), "EX", 300); // 5 min expiry
}

export async function getSignupData(email: string) {
  const data = await redis.get(`signup:${email}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSignupData(email: string) {
  await redis.del(`signup:${email}`);
}