// app/api/cron/enrich/route.ts
import { NextResponse } from 'next/server';
import { getSheetTokens } from '@/lib/getSheetTokens';
import { enrichWithPrices } from '@/lib/enrichWithPrices';
import { fetchKPIsFromSheet } from '@/lib/getSheetKPIs';
import { fetchWalletsFromSheet } from '@/lib/getSheetWallets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ... (โค้ดเช็ค Auth Header เหมือนเดิม) ...
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('⏰ Cron Job Started...');

    // 1️⃣ Task 1: ดึงราคาเหรียญ (Token Prices)
    console.log('--- Task 1: Enrich Tokens ---');
    const sheetTokens = await getSheetTokens();
    const enriched = await enrichWithPrices(sheetTokens, undefined, true);

    // 2️⃣ Task 2: ดึง KPI History
    console.log('--- Task 2: Refresh KPIs ---');
    const kpis = await fetchKPIsFromSheet();

    // 3️⃣ Task 3: ดึงรายชื่อ Wallet (Refresh Cache) 👈 เพิ่มส่วนนี้
    console.log('--- Task 3: Refresh Wallets ---');
    // ใช้ Promise.all เพื่อให้ดึงทั้ง 3 ประเภทพร้อมกัน (เร็วขึ้น)
    const [evm, sol, etc] = await Promise.all([
      fetchWalletsFromSheet('evm'),
      fetchWalletsFromSheet('sol'),
      fetchWalletsFromSheet('etc'),
    ]);

    console.log(`📊 KPIs Updated: ${kpis.length}`);
    console.log(
      `👛 Wallets Updated: EVM=${evm.length}, SOL=${sol.length}, ETC=${etc.length}`
    );
    console.log('✅ Cron Job Finished');

    return NextResponse.json({
      success: true,
      summary: {
        tokensUpdated: enriched.length,
        kpisUpdated: kpis.length,
        walletsUpdated: {
          evm: evm.length,
          sol: sol.length,
          etc: etc.length,
        },
      },
    });
  } catch (err) {
    console.error('❌ Cron Job Error:', err);
    return NextResponse.json(
      {
        error: 'Failed to run cron',
        details: String(err),
      },
      { status: 500 }
    );
  }
}
