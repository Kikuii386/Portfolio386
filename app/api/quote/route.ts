import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // 1. รับ chainId มาจากหน้าบ้าน (ถ้าไม่ส่งมา Default เป็น 1 = Ethereum)
    const chainId = searchParams.get('chainId') || '1';

    // 2. Map Chain ID ให้ตรงกับ Domain ของ 0x API
    const domainMap: Record<string, string> = {
        '1': 'api.0x.org',           // Ethereum
        '8453': 'base.api.0x.org',   // Base
        '56': 'bsc.api.0x.org',      // BSC (Binance Smart Chain)
        '137': 'polygon.api.0x.org', // Polygon
        '42161': 'arbitrum.api.0x.org', // Arbitrum
        '10': 'optimism.api.0x.org', // Optimism
        '43114': 'avalanche.api.0x.org', // Avalanche
    };

    // ถ้า chainId ที่ส่งมาไม่มีใน map ให้ใช้ Ethereum เป็น Default
    const domain = domainMap[chainId] || 'api.0x.org';

    // 3. สร้าง URL ใหม่ตาม Domain ที่เลือก
    const targetUrl = new URL(`https://${domain}/swap/v1/quote`);

    // Copy params ทั้งหมดจากหน้าบ้านไปใส่ใน URL ใหม่
    searchParams.forEach((value, key) => {
        if (key !== 'chainId') {
            targetUrl.searchParams.append(key, value);
        }
    });

    const apiKey = process.env.ZERO_EX_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    try {
        // 4. ยิงไปหา 0x
        const res = await fetch(targetUrl.toString(), {
            headers: {
                '0x-api-key': apiKey,
            },
        });

        const data = await res.json();

        // เช็คว่า 0x ตอบกลับมาเป็น Error หรือไม่
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }
}