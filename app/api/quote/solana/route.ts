import { NextResponse, type NextRequest } from 'next/server';

// 🌟 ดึง API Key จากไฟล์ .env (ใช้ || '' ป้องกัน Error กรณีลืมใส่)
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '';

// ✅ 1. ฟังก์ชัน GET: สำหรับดึงราคา (Quote)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // อัปเดต URL เป็นระบบใหม่ล่าสุดของ Jupiter (v1)
    const jupiterUrl = `https://api.jup.ag/swap/v1/quote?${searchParams.toString()}`;

    try {
        const res = await fetch(jupiterUrl, {
            headers: {
                'Content-Type': 'application/json',
                // แนบ API Key เข้าไปใน Header ถ้ามีค่าใน .env
                ...(JUPITER_API_KEY && { 'x-api-key': JUPITER_API_KEY }),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Jupiter Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// 🌟 2. เพิ่มฟังก์ชัน POST: สำหรับขอข้อมูล Swap Transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // อัปเดต URL เป็นระบบใหม่ล่าสุดของ Jupiter (v1)
        const res = await fetch('https://api.jup.ag/swap/v1/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // แนบ API Key เข้าไปใน Header ถ้ามีค่าใน .env
                ...(JUPITER_API_KEY && { 'x-api-key': JUPITER_API_KEY }),
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Jupiter Swap Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}