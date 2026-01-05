// lib/getSheetKPIs.ts
import { getFromCache, setToCache } from '@/lib/redisCache';

export type KPIRow = {
  date: string;
  investment: number;
  dividend: number;
  value: number;
  f_g: number;
  buy: number;
  sell: number;
};

// 🛠️ ฟังก์ชันดึงสด (ใช้สำหรับ Cron Job หรือตอน Cache หลุด)
export async function fetchKPIsFromSheet(): Promise<KPIRow[]> {
  const url = process.env.GSHEETS_KPI_ENDPOINT;
  if (!url) throw new Error('GSHEETS_KPI_ENDPOINT is not defined');

  console.log("📊 Fetching KPIs from Google Sheets...");
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch KPI data');

  const rawData = await res.json();

  const cleanedData = rawData.map((item: any) => {
    let dateStr = item.date;
    if (dateStr && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
    }

    return {
      date: dateStr, 
      investment: Number(item.investment) || 0,
      dividend: Number(item.dividend) || 0,
      value: Number(item.value) || 0,
      f_g: Number(item.f_g) || 0,
      buy: Number(item.buy) || 0,
      sell: Number(item.sell) || 0,
    };
  }) as KPIRow[];

  // บันทึกลง Cache ทันทีที่ดึงเสร็จ (อายุ 24 ชม.)
  await setToCache('sheet:kpis', cleanedData, 86400);
  
  return cleanedData;
}

// 🚀 ฟังก์ชันหลักที่หน้าเว็บเรียกใช้ (อ่าน Cache ก่อนเสมอ)
export async function getSheetKPIs(): Promise<KPIRow[]> {
  try {
    // 1. ลองอ่านจาก Redis
    const cached = await getFromCache('sheet:kpis');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      // console.log("⚡️ KPIs loaded from Cache");
      return cached;
    }
    
    // 2. ถ้าไม่มี Cache ให้ดึงสด (Fallback)
    console.log("⚠️ KPI Cache miss, fetching fresh...");
    return await fetchKPIsFromSheet();

  } catch (error) {
    console.error("❌ getSheetKPIs Error:", error);
    return [];
  }
}