import { NextResponse } from 'next/server';
import { getSheetTokens } from '@/lib/getSheetTokens';
import { enrichWithPrices } from '@/lib/enrichWithPrices';

// ✅ บังคับให้เป็น Dynamic เสมอ เพื่อไม่ให้ cache ค่าเก่า
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 🔒 ส่วนตรวจสอบความปลอดภัย (Security Check)
  // จะอนุญาตให้รันก็ต่อเมื่อมีรหัสลับที่ถูกต้องส่งมาทาง Header เท่านั้น
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    console.log('⏰ Cron Job Started: Force Refreshing Prices...');

    const sheetTokens = await getSheetTokens();
    const enriched = await enrichWithPrices(sheetTokens, undefined, true);

    console.log('✅ Cron Job Finished');
    return NextResponse.json({ success: true, count: enriched.length });
  } catch (err) {
    console.error('❌ Cron Job Error:', err);
    return NextResponse.json({ error: 'Failed to run cron' }, { status: 500 });
  }
}
