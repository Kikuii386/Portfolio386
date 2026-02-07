import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // 1. รับค่า params จากหน้าบ้าน (เช่น buyToken, sellToken, sellAmount)
    const { searchParams } = new URL(request.url);

    // 2. เตรียม URL ของ 0x
    // หมายเหตุ: ต้องส่ง query string ต่อท้ายไปด้วย
    const targetUrl = `https://api.0x.org/swap/v1/quote?${searchParams.toString()}`;

    const apiKey = process.env.ZERO_EX_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    try {
        // 3. ยิงไปหา 0x โดยแนบ Key ไปใน Header (ฝั่ง Server ทำ คนดูเว็บไม่เห็น Key)
        const res = await fetch(targetUrl, {
            headers: {
                '0x-api-key': apiKey,
            },
        });

        const data = await res.json();

        // 4. ส่งผลลัพธ์กลับไปให้หน้าบ้าน
        return NextResponse.json(data, { status: res.status });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }
}