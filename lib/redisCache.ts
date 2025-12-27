import { Redis } from '@upstash/redis';

// เชื่อมต่อ Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * ดึงข้อมูลจาก Redis
 */
export async function getFromCache<T = any>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (e) {
    console.warn("[Redis Cache] Get error:", e);
    return null;
  }
}

/**
 * บันทึกข้อมูลลง Redis พร้อมตั้งเวลาหมดอายุ (TTL)
 */
export async function setToCache(
  key: string,
  value: any,
  ttlSeconds: number = 21600 // 6 ชั่วโมง
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.warn("[Redis Cache] Set error:", e);
  }
}