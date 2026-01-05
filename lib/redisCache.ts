import 'server-only';
import Redis from "ioredis";

// 1. สร้าง Singleton Pattern เพื่อป้องกัน Connection บานปลายใน Next.js (Hot Reload)
const getRedisClient = () => {
  if (!global.redisClient) {
    // ถ้าไม่มี Env REDIS_URL ให้ใช้ localhost:6379 เป็นค่า Default
    const connectionString = process.env.REDIS_URL || "redis://localhost:6379";
    
    console.log(`🔌 Initializing Redis connection to ${connectionString}...`);
    
    global.redisClient = new Redis(connectionString, {
      maxRetriesPerRequest: 3, // ลองใหม่แค่ 3 ครั้งถ้าต่อไม่ติด
    });
  }
  return global.redisClient;
};

// ประกาศ Type สำหรับ TypeScript Global
declare global {
  var redisClient: Redis | undefined;
}

const redis = getRedisClient();

// 2. ฟังก์ชัน getFromCache (หน้าตาเดิม แต่ไส้ในเปลี่ยน)
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[Redis] Get Error (${key}):`, error);
    return null; // ถ้า Error ให้ถือว่าหาไม่เจอ (App จะได้ไม่พัง)
  }
}

// 3. ฟังก์ชัน setToCache
export async function setToCache(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    const data = JSON.stringify(value);
    // 'EX' หน่วยเป็นวินาที
    await redis.set(key, data, "EX", ttlSeconds);
  } catch (error) {
    console.error(`[Redis] Set Error (${key}):`, error);
  }
}