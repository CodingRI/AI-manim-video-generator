import IORedis from "ioredis"

export const connection = new IORedis({
    host: process.env.UPSTASH_REDIS_HOST,
    port: Number(process.env.UPSTASH_REDIS_PORT),
    password: process.env.UPSTASH_REDIS_PASSWORD,
    tls: {},
    
    maxRetriesPerRequest: null,
})

