// app/api/cron/enrich/route.ts
import { NextResponse } from 'next/server';
import { getSheetTokens } from '@/lib/getSheetTokens';
import { enrichWithPrices } from '@/lib/enrichWithPrices';
import { fetchKPIsFromSheet } from '@/lib/getSheetKPIs'; // 👈 Import ตัวนี้เพิ่ม

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ... (โค้ดเช็ค Auth Header เหมือนเดิม) ...
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('⏰ Cron Job Started...');

    // 1️⃣ ดึงราคาเหรียญ (งานเดิม)
    console.log('--- Task 1: Enrich Tokens ---');
    const sheetTokens = await getSheetTokens();
    const enriched = await enrichWithPrices(sheetTokens, undefined, true);

    // 2️⃣ ดึง KPI History (งานใหม่) 👈 เพิ่มตรงนี้
    console.log('--- Task 2: Refresh KPIs ---');
    const kpis = await fetchKPIsFromSheet();

    console.log('✅ Cron Job Finished');
    return NextResponse.json({
      success: true,
      tokensCount: enriched.length,
      kpisCount: kpis.length,
    });
  } catch (err) {
    console.error('❌ Cron Job Error:', err);
    return NextResponse.json({ error: 'Failed to run cron' }, { status: 500 });
  }
}
