import Redis from 'ioredis';

// สร้างตัวแปร Global เพื่อกันการเปิด Connection ซ้ำซ้อนใน Next.js
declare global {
  var redisClient: Redis | undefined;
}

const getRedisClient = () => {
  if (!global.redisClient) {
    // ดึงค่าจาก .env ถ้าไม่มีให้ใช้ localhost:6379 เป็นค่าเริ่มต้น
    const connectionString = process.env.REDIS_URL 

    console.log(`🔌 Initializing Redis connection...`);
    global.redisClient = new Redis(connectionString, {
      maxRetriesPerRequest: 3, // ถ้าต่อไม่ได้ให้ลองแค่ 3 ครั้งพอ
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay; // รอเวลาเพิ่มขึ้นเรื่อยๆ ก่อนลองต่อใหม่
      },
    });

    global.redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });

    global.redisClient.on('connect', () => {
      console.log('✅ Redis Connected!');
    });
  }
  return global.redisClient;
};

const redis = getRedisClient();

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[Redis Get Error] Key: ${key}`, error);
    return null; // ถ้า Error ให้ถือว่า Cache ว่าง (เว็บจะได้ไปโหลดใหม่เอง)
  }
}

export async function setToCache(
  key: string,
  value: any,
  ttlSeconds: number = 3600
) {
  try {
    const data = JSON.stringify(value);
    await redis.set(key, data, 'EX', ttlSeconds);
  } catch (error) {
    console.error(`[Redis Set Error] Key: ${key}`, error);
  }
}
