// 📄 app/api/price/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chain = searchParams.get('chain'); // รับชื่อจาก activeChain.id เช่น 'ethereum', 'bsc'

    if (!address) {
        return NextResponse.json({ price: 0 });
    }

    try {
        // 1. แปลงชื่อ Chain ของเรา ให้เป็นชื่อที่ DexScreener รู้จัก
        const dexChainMap: Record<string, string> = {
            'ethereum': 'ethereum',
            'bsc': 'bsc',
            'polygon': 'polygon',
            'arbitrum': 'arbitrum',
            'base': 'base',
            'optimism': 'optimism',
            'linea': 'linea',
            'blast': 'blast',
            'avalanche': 'avalanche',
            'sonic': 'sonic',
            'berachain': 'berachain',
            'abstract': 'abstract',
            'hyperliquid': 'hyperliquid',
            'zksync': 'zksync',
            'solana': 'solana'
        };

        const targetDexChain = chain ? dexChainMap[chain.toLowerCase()] : null;

        // 2. ดึงข้อมูลจาก DexScreener
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
            next: { revalidate: 30 } // ปรับเหลือ 30 วินาทีเพื่อให้ราคา Real-time ขึ้น
        });

        if (!res.ok) throw new Error('DexScreener API error');
        const data = await res.json();

        if (!data.pairs || data.pairs.length === 0) {
            return NextResponse.json({ price: 0 });
        }

        // 3. กรองข้อมูล (Filtering)
        let validPairs = data.pairs;

        // กรองตาม Chain ที่เราเลือกก่อน เพื่อป้องกันราคาข้ามเชน (ถ้ามี)
        if (targetDexChain) {
            const chainPairs = data.pairs.filter((p: any) => p.chainId === targetDexChain);
            if (chainPairs.length > 0) {
                validPairs = chainPairs;
            }
        }

        // 4. เรียงตาม Liquidity (USD) จากมากไปน้อย
        // และเพิ่มการกรองคู่เทรดที่มี Liquidity ต่ำมากๆ ออก (เช่น ต่ำกว่า $100) เพื่อกันราคาปั่น
        validPairs = validPairs.filter((p: any) => (p.liquidity?.usd || 0) > 100);

        if (validPairs.length === 0) {
            // ถ้ากรองแล้วไม่เหลือเลย ให้กลับไปใช้ข้อมูลเดิม (เผื่อเป็นเหรียญใหม่มาก)
            validPairs = data.pairs;
        }

        validPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        // 5. ดึงราคาจากตัวที่ Liquidity สูงที่สุด
        const bestPair = validPairs[0];
        const price = parseFloat(bestPair.priceUsd);

        return NextResponse.json({
            price: isNaN(price) ? 0 : price,
            pairAddress: bestPair.pairAddress,
            dexId: bestPair.dexId,
            chain: bestPair.chainId
        });

    } catch (error) {
        console.error('Price Fetch Error:', error);
        return NextResponse.json({ price: 0, error: 'Failed to fetch price' });
    }
}