import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // 1. ดึง Query Params จาก URL ที่หน้าบ้านส่งมา
    const { searchParams } = new URL(request.url);

    // 2. สร้าง URL ปลายทางไปหา Jupiter (Official API v6)
    // เราจะส่งต่อ params ทั้งหมด (inputMint, outputMint, amount, slippageBps) ไปเลย
    const jupiterUrl = `https://quote-api.jup.ag/v6/quote?${searchParams.toString()}`;

    try {
        // 3. ยิงไปหา Jupiter (ตอนนี้ยังฟรี ไม่ต้องใส่ Key แต่ทำเผื่อไว้)
        const res = await fetch(jupiterUrl, {
            headers: {
                'Content-Type': 'application/json',
                // ถ้าอนาคตต้องใช้ Key ก็ใส่ตรงนี้: 'Authorization': process.env.JUPITER_API_KEY
            },
        });

        if (!res.ok) {
            throw new Error(`Jupiter API Error: ${res.statusText}`);
        }

        const data = await res.json();

        // 4. ส่งผลลัพธ์กลับไปหน้าบ้าน
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Jupiter Quote Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Solana quote' }, { status: 500 });
    }
}