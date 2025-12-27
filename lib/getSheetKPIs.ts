// lib/getSheetKPIs.ts

export type KPIRow = {
  date: string;
  investment: number;
  dividend: number;
  value: number;
  f_g: number;
  buy: number;
  sell: number;
};

export async function getSheetKPIs(): Promise<KPIRow[]> {
  const url = process.env.GSHEETS_KPI_ENDPOINT;
  if (!url) throw new Error('GSHEETS_KPI_ENDPOINT is not defined');

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch KPI data');

  const rawData = await res.json();

  // ✅ เพิ่มขั้นตอนการ Clean Data ตรงนี้
  return rawData.map((item: any) => {
    
    // 1. จัดการวันที่: ตัดเวลาทิ้งเอาแต่วันที่ เพื่อกันเรื่อง Timezone Shift
    // ถ้า Google ส่งมาเป็น "2024-11-01T00:00:00.000Z" การแปลง new Date() อาจเพี้ยนได้
    let dateStr = item.date;
    if (dateStr && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]; // เอาเฉพาะ "2024-11-01"
    }

    return {
      date: dateStr, 
      // 2. บังคับแปลงตัวเลข: เผื่อมี String ปนมา เช่น "1,000" หรือ "-"
      investment: Number(item.investment) || 0,
      dividend: Number(item.dividend) || 0,
      value: Number(item.value) || 0,
      f_g: Number(item.f_g) || 0,
      buy: Number(item.buy) || 0,
      sell: Number(item.sell) || 0,
    };
  }) as KPIRow[];
}