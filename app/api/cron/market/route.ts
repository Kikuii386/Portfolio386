// app/api/cron/market/route.ts
import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/market-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. ตรวจสอบ Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('⏰ [Cron] Market Refresh Started...');

        // 2. บังคับดึงข้อมูลใหม่ (forceRefresh = true)
        const data = await getMarketData(true);

        if (!data) {
            throw new Error('No data returned from service');
        }

        return NextResponse.json({
            success: true,
            timestamp: data.lastUpdated,
            coinsCount: data.coins.length
        });

    } catch (err) {
        console.error('❌ [Cron] Market Error:', err);
        return NextResponse.json(
            { error: 'Failed to refresh market data', details: String(err) },
            { status: 500 }
        );
    }
}