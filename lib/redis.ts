import IORedis from "ioredis";

const isProd = process.env.NODE_ENV === "production";

// export const connection = isProd
//   ? new IORedis({
//       host: process.env.UPSTASH_REDIS_HOST,
//       port: Number(process.env.UPSTASH_REDIS_PORT),
//       password: process.env.UPSTASH_REDIS_PASSWORD,
//       tls: {},

//       maxRetriesPerRequest: null,
//     })
//   : new IORedis("redis://127.0.0.1:6379", {
//       maxRetriesPerRequest: null,
//     });


    export const connection = 
        new IORedis({
        host: process.env.UPSTASH_REDIS_HOST,
        port: Number(process.env.UPSTASH_REDIS_PORT),
        password: process.env.UPSTASH_REDIS_PASSWORD,
        tls: {},
  
        maxRetriesPerRequest: null,
      })
   