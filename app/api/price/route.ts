// 📄 app/api/price/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chainId = searchParams.get('chain'); // รับชื่อ chain เช่น 'ethereum', 'base'

    if (!address) {
        return NextResponse.json({ price: 0 });
    }

    try {
        // ดึงข้อมูลดิบจาก DexScreener
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
            next: { revalidate: 60 } // Cache ราคา 60 วินาที ช่วยลดการยิง request ถี่ๆ
        });
        const data = await res.json();

        if (!data.pairs || data.pairs.length === 0) {
            return NextResponse.json({ price: 0 });
        }

        // 🔍 เริ่ม Logic กรองราคา (สำคัญมาก!)
        let validPairs = data.pairs;

        // 1. กรอง Chain: ถ้าส่ง chainId มา ให้เลือกเฉพาะคู่ที่อยู่บน chain นั้น
        if (chainId) {
            validPairs = data.pairs.filter((p: any) => p.chainId === chainId);
            // Fallback: ถ้าไม่เจอใน chain ตัวเองจริงๆ ให้ใช้ข้อมูลทั้งหมดไปก่อน
            if (validPairs.length === 0) validPairs = data.pairs;
        }

        // 2. เรียงตาม Liquidity: เอา Pool ที่มีเงินเยอะที่สุดขึ้นก่อน (ป้องกันราคาเพี้ยนจาก Pool ร้าง)
        validPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        // 3. ดึงราคาจากตัวแรก (Best Liquidity)
        const price = parseFloat(validPairs[0].priceUsd);

        return NextResponse.json({
            price: isNaN(price) ? 0 : price,
            src: validPairs[0].pairAddress // (Optional) เผื่ออยากรู้ว่าได้ราคามาจาก Pool ไหน
        });

    } catch (error) {
        console.error('Price Fetch Error:', error);
        return NextResponse.json({ price: 0 });
    }
}