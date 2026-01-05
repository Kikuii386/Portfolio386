// lib/getDashboardData.ts
import { getFromCache } from '@/lib/redisCache';
import { getSheetTokens } from '@/lib/getSheetTokens';
import { enrichWithPrices } from '@/lib/enrichWithPrices';

export async function getDashboardData() {
  try {
    // 🚀 1. ลองอ่านจาก Cache (Redis) ก่อน (เร็วมาก < 0.01 วินาที)
    const cachedData = await getFromCache('sheet:enrichedTokens');

    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
      return cachedData;
    }

    // 🐢 2. ถ้าไม่มี Cache จริงๆ ค่อยไปโหลดจาก Google Sheets (ช้าหน่อยแต่มีข้อมูลโชว์)
    console.log('⚠️ Cache miss, fetching fresh data...');
    const tokens = await getSheetTokens();
    const freshData = await enrichWithPrices(tokens);
    return freshData;
  } catch (error) {
    console.error('❌ Failed to get dashboard data:', error);
    return [];
  }
}
