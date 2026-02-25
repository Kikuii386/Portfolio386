import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';


// ✅ 1. ฟังก์ชัน GET: สำหรับดึงราคา (Quote)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const JUPITER_API_KEY = (process.env.JUPITER_API_KEY || '').trim();

    // 🕵️‍♂️ ตัวจับผิด: ถ้ามันดึงได้ มันจะพ่นความยาวของ Key ออกมา
    console.log("🔥 [GET] JUPITER KEY:", JUPITER_API_KEY ? `เจอแล้ว! (ยาว ${JUPITER_API_KEY.length} ตัวอักษร)` : "ว่างเปล่า!!");

    // อัปเดต URL เป็นระบบใหม่ล่าสุดของ Jupiter (v1)
    const jupiterUrl = `https://api.jup.ag/swap/v1/quote?${searchParams.toString()}`;

    try {
        const res = await fetch(jupiterUrl, {
            headers: {
                'Content-Type': 'application/json',
                // แนบ API Key เข้าไปใน Header ถ้ามีค่าใน .env
                ...(JUPITER_API_KEY && { 'x-api-key': JUPITER_API_KEY }),
            },
            cache: 'no-store',
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
    const JUPITER_API_KEY = (process.env.JUPITER_API_KEY || '').trim();

    // 🕵️‍♂️ ตัวจับผิด: เช็คทั้ง POST และ GET
    console.log("🔥 [POST] JUPITER KEY:", JUPITER_API_KEY ? `เจอแล้ว! (ยาว ${JUPITER_API_KEY.length} ตัวอักษร)` : "ว่างเปล่า!!");
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
            cache: 'no-store',
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