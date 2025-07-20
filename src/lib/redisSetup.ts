import { Redis } from "@upstash/redis";

// if (
//   !process.env.UPSTASH_REDIS_REST_TOKEN ||
//   !process.env.UPSTASH_REDIS_REST_URL
// ) {
//   throw new Error("Missing Upstash Redis Environment Variables");
// }

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getJSON(key: string) {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    if (typeof data === "string") {
      return JSON.parse(data);
    } else if (typeof data === "object") {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Redis getJSON error for key ${key}:`, error);
    await redis.del(key);
    return null;
  }
}

export async function setJSON(key: string, value: number, options = {}) {
  try {
    const serialized = JSON.stringify(value);
    return await redis.set(key, serialized, options);
  } catch (error) {
    console.error(`Redis setJSON error for key ${key}:`, error);
    return false;
  }
}

export default redis;
