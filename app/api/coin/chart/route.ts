import { NextRequest, NextResponse } from 'next/server';

// 🗺️ Map ชื่อ Chain ให้ตรงกับ Network ID ของ GeckoTerminal (จะต่างจาก CoinGecko นิดหน่อย)
const GECKOTERMINAL_MAP: Record<string, string> = {
    eth: "eth",
    ethereum: "eth",
    bsc: "bsc",
    bnb: "bsc",
    sol: "solana",
    solana: "solana",
    polygon: "polygon_pos", // ระวัง! CoinGecko ใช้ polygon-pos แต่ GT ใช้ underscore
    matic: "polygon_pos",
    base: "base",
    arb: "arbitrum",
    arbitrum: "arbitrum",
    op: "optimism",
    optimism: "optimism",
    avax: "avalanche",
    avalanche: "avalanche"
};

// ฟังก์ชันช่วยเลือก Timeframe ให้เหมาะสมกับจำนวนวัน
function getGtTimeframe(days: string) {
    if (days === '1') return { timeframe: 'minute', aggregate: 15 }; // 1 วัน -> ดูแท่งละ 15 นาที
    if (days === '7') return { timeframe: 'hour', aggregate: 4 };    // 7 วัน -> ดูแท่งละ 4 ชม.
    return { timeframe: 'day', aggregate: 1 };                       // 30+ วัน -> ดูแท่งละ 1 วัน
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const days = searchParams.get('days') || '1';
    const address = searchParams.get('address');
    const chain = searchParams.get('chain');

    // ✅ 1. ถ้ามี CoinGecko ID ให้ลองใช้ก่อน (แม่นยำสำหรับเหรียญ CEX)
    if (id && id !== 'undefined' && id !== 'null') {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
            const apiKey = process.env.COINGECKO_API_KEY;
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

            const res = await fetch(url, { headers, next: { revalidate: 60 } });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data);
            }
        } catch (e) {
            console.warn("CoinGecko ID fetch failed, trying GeckoTerminal...");
        }
    }

    // ✅ 2. Fallback: ถ้าไม่มี ID หรือดึงไม่ได้ ให้ใช้ GeckoTerminal (ผ่าน Address)
    if (chain && address) {
        try {
            const network = GECKOTERMINAL_MAP[chain.toLowerCase()] || chain.toLowerCase();

            // 2.1 หา Pool ที่ดีที่สุดของ Token นี้ก่อน (Top Pool)
            const poolUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${address}/pools?page=1`;
            const poolRes = await fetch(poolUrl, { next: { revalidate: 300 } }); // Cache Pool นานหน่อย (5 นาที)

            if (!poolRes.ok) throw new Error("Pool not found");

            const poolData = await poolRes.json();
            const topPool = poolData.data?.[0]; // เอา Pool แรกสุด (Liquidity สูงสุด)

            if (!topPool) throw new Error("No pool data");

            const poolAddress = topPool.attributes.address;

            // 2.2 ดึงกราฟ OHLCV จาก Pool Address
            const { timeframe, aggregate } = getGtTimeframe(days);
            const chartUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&currency=usd`;

            const chartRes = await fetch(chartUrl, { next: { revalidate: 60 } });
            if (!chartRes.ok) throw new Error("Chart data not found");

            const chartData = await chartRes.json();

            // 2.3 แปลง Format กลับเป็นแบบ CoinGecko เพื่อให้ Frontend (Recharts) ใช้งานได้เลย
            const prices = chartData.data.attributes.ohlcv_list.map((item: number[]) => [
                item[0] * 1000,
                item[4]
            ]).reverse();

            return NextResponse.json({ prices });

        } catch (error) {
            console.error("GeckoTerminal Error:", error);
            // ถ้าไม่เจอจริงๆ ส่ง error กลับไป (Frontend จะไปแสดง Mock เอง)
            return NextResponse.json({ error: 'Data not found' }, { status: 404 });
        }
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}