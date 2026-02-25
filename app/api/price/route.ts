// 📄 app/api/price/route.ts
import { NextResponse, type NextRequest } from 'next/server';

// 🌟 1. ดึงชุดข้อมูลคัดกรองจากโค้ดของคุณ
const TRUSTED_QUOTES = new Set([
    "WETH", "ETH", "STETH", "CBETH", "WETH.E", "SOL", "WSOL", "MSOL", "JITOSOL",
    "WBNB", "BNB", "WMATIC", "MATIC", "WMATIC.E", "WAVAX", "AVAX", "WAVAX.E",
    "SUI", "WSUI", "WBTC", "BTC", "CBTC", "USDT", "USDT.E", "USDC", "USDC.E",
    "USDBC", "BUSD", "DAI", "FDUSD"
]);
const BLACKLIST_QUOTES = new Set(["KABOSU", "BITCOIN", "HARRYPOTTER", "OBAMA"]);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chain = searchParams.get('chain');

    if (!address) {
        return NextResponse.json({ price: 0 });
    }

    try {
        const dexChainMap: Record<string, string> = {
            'ethereum': 'ethereum', 'bsc': 'bsc', 'polygon': 'polygon',
            'arbitrum': 'arbitrum', 'base': 'base', 'optimism': 'optimism',
            'linea': 'linea', 'blast': 'blast', 'avalanche': 'avalanche',
            'sonic': 'sonic', 'berachain': 'berachain', 'abstract': 'abstract',
            'hyperliquid': 'hyperliquid', 'zksync': 'zksync', 'solana': 'solana'
        };

        const targetDexChain = chain ? dexChainMap[chain.toLowerCase()] : null;

        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
            next: { revalidate: 30 }
        });

        if (!res.ok) throw new Error('DexScreener API error');
        const data = await res.json();

        if (!data.pairs || data.pairs.length === 0) {
            // 🔥 เปลี่ยนจากส่ง price: 0 เป็นส่ง Error กลับไปตรงๆ
            return NextResponse.json({ error: 'No pairs found for this token' }, { status: 404 });
        }

        const queriedAddress = address.toLowerCase();

        // 🌟 2. อัปเกรดการกรอง (Filtering) ผสมผสาน Logic ของคุณ
        let processedPairs = data.pairs
            .filter((p: any) => !targetDexChain || p.chainId === targetDexChain) // กรองเชน
            .map((p: any) => {
                const baseAddr = p.baseToken?.address?.toLowerCase() || '';
                const quoteAddr = p.quoteToken?.address?.toLowerCase() || '';

                // หาว่าเหรียญ "คู่หู" ของเราใน Pool นี้คือใคร (เพื่อเอาไปเช็ค Trusted/Blacklist)
                let otherSymbol = '';
                if (queriedAddress === baseAddr) {
                    otherSymbol = (p.quoteToken?.symbol || '').toUpperCase().trim();
                } else if (queriedAddress === quoteAddr) {
                    otherSymbol = (p.baseToken?.symbol || '').toUpperCase().trim();
                }

                const liq = p.liquidity?.usd || 0;
                const isTrusted = TRUSTED_QUOTES.has(otherSymbol);

                return { ...p, _otherSymbol: otherSymbol, _isTrusted: isTrusted, _liq: liq };
            })
            .filter((p: any) => {
                if (!p._otherSymbol) return false; // หาเหรียญคู่ไม่เจอ (ป้องกันบั๊ก)

                // ⛔ Blacklist Check: ตัดเหรียญกาวทิ้ง
                if (BLACKLIST_QUOTES.has(p._otherSymbol)) return false;

                // 💧 Min Liquidity: สระน้ำต้องมีเงินอย่างน้อย $50
                if (p._liq < 50) return false;

                // 🛡️ Spam Filter: ถ้าคู่เทรดไม่ใช่เหรียญหลัก (Untrusted) แต่ดันมี Liquidity > 10M ให้เตะทิ้ง (สระปลอมชัวร์)
                if (!p._isTrusted && p._liq > 10_000_000) return false;

                return true;
            });

        if (processedPairs.length === 0) {
            // Fallback: ถ้ากรองเข้มไปจนไม่เหลือ ให้ใช้ของเดิมที่ Liquidity สูงสุด
            processedPairs = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        } else {
            // 🌟 3. อัปเกรดการเรียงลำดับ (Sorting) ให้ความสำคัญกับ Trusted Quotes ก่อนเสมอ
            processedPairs.sort((a: any, b: any) => {
                // เอา Trusted ขึ้นก่อน
                if (a._isTrusted && !b._isTrusted) return -1;
                if (!a._isTrusted && b._isTrusted) return 1;
                // ถ้า Trusted เหมือนกัน ให้เรียงตาม Liquidity จากมากไปน้อย
                return b._liq - a._liq;
            });
        }

        // 🌟 4. ดึงราคา + การสลับ Base/Quote ที่เราทำไว้ (เพื่อไม่ให้ดึงราคา ETH มาแทน USD)
        const bestPair = processedPairs[0];
        let finalPrice = 0;
        let queriedSymbol = ''; // 🔥 เพิ่มตัวแปรเก็บ "ชื่อเหรียญที่เราค้นหาจริงๆ"

        const baseAddress = bestPair.baseToken?.address?.toLowerCase() || '';
        const quoteAddress = bestPair.quoteToken?.address?.toLowerCase() || '';

        if (queriedAddress === baseAddress) {
            finalPrice = parseFloat(bestPair.priceUsd);
            queriedSymbol = (bestPair.baseToken?.symbol || '').toLowerCase(); // จำชื่อไว้
        } else if (queriedAddress === quoteAddress) {
            const basePriceUsd = parseFloat(bestPair.priceUsd);
            const basePriceNative = parseFloat(bestPair.priceNative);
            if (basePriceNative > 0) {
                finalPrice = basePriceUsd / basePriceNative;
            }
            queriedSymbol = (bestPair.quoteToken?.symbol || '').toLowerCase(); // จำชื่อไว้
        } else {
            finalPrice = parseFloat(bestPair.priceUsd);
        }

        // 🔥 Sanity Check ที่ถูกต้อง: ตรวจสอบ "เฉพาะชื่อเหรียญที่เราค้นหา" เท่านั้น! (ไม่เหมารวมคู่เทรด)
        const isStablecoin = ['usdt', 'usdc', 'dai', 'usdc.e', 'usdt.e', 'usdbc', 'usd'].some(
            symbol => queriedSymbol.includes(symbol)
        );

        if (isStablecoin && (finalPrice > 2 || finalPrice < 0.5)) {
            finalPrice = 1.0;
        }

        return NextResponse.json({
            price: isNaN(finalPrice) ? 0 : finalPrice,
            pairAddress: bestPair.pairAddress,
            dexId: bestPair.dexId,
            chain: bestPair.chainId,
            // ส่งข้อมูลเผื่อไว้ให้หน้าจอรู้ว่าดึงมาจากคู่ไหน
            _debug_pair: `${bestPair.baseToken?.symbol}/${bestPair.quoteToken?.symbol}`
        });

    } catch (error) {
        console.error('Price Fetch Error:', error);
        return NextResponse.json({ price: 0, error: 'Failed to fetch price' });
    }
}