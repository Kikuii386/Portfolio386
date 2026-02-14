import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // Jupiter API V6 Endpoint
    const jupiterUrl = `https://quote-api.jup.ag/v6/quote?${searchParams.toString()}`;

    try {
        const res = await fetch(jupiterUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await res.json();

        // ✅ ถ้า Jupiter ตอบ Error (เช่น 400) ให้ส่ง Error นั้นกลับไปหน้าบ้านเลย
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Jupiter Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}