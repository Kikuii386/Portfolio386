import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId') || '1';
    const taker = searchParams.get('taker') || searchParams.get('takerAddress');

    const apiKey = process.env.ZERO_EX_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }
    const endpoint = taker ? 'swap/allowance-holder/quote' : 'swap/allowance-holder/price';

    const targetUrl = new URL(`https://api.0x.org/${endpoint}`);

    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    if (taker && !targetUrl.searchParams.has('takerAddress')) {
        targetUrl.searchParams.set('takerAddress', taker);
    }

    if (!targetUrl.searchParams.has('chainId')) {
        targetUrl.searchParams.append('chainId', chainId);
    }

    try {
        const res = await fetch(targetUrl.toString(), {
            headers: {
                '0x-api-key': apiKey,
                '0x-version': 'v2',
            },
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('0x API Error:', data);
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }
}