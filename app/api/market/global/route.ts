// app/api/market/global/route.ts
import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/market-service';

export const dynamic = 'force-dynamic'; // ไม่ให้ Next.js ทำ Static Cache ทับ

export async function GET() {
    try {
        // forceRefresh = false (พยายามอ่านจาก Cache ก่อน)
        const data = await getMarketData(false);

        if (!data) {
            return NextResponse.json({ error: 'Failed to load market data' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}