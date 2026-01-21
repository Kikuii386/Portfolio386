import { NextResponse } from 'next/server';
import { MOCK_MARKET_DATA } from './mock-data';

// Cache 60 วินาที (ดึงทีเดียวได้ครบ ลดภาระ Server)
export const revalidate = 60;

export async function GET() {
    try {
        // ✅ ใช้ Promise.all เพื่อยิง 3 API พร้อมกัน (เร็วกว่ายิงทีละตัว)
        const [globalRes, coinsRes, gasRes] = await Promise.all([
            // 1. Global Market Data
            fetch('https://api.coingecko.com/api/v3/global', { headers: { 'Accept': 'application/json' } }),

            // 2. Top 50 Coins List (สำหรับ Table & Highlights)
            fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d', { headers: { 'Accept': 'application/json' } }),

            // 3. Gas Price (ใช้ PublicNode ที่เสถียรกว่า LlamaRPC)
            fetch('https://ethereum.publicnode.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
            })
        ]);

        // เช็ค Error พร้อม Log
        if (!globalRes.ok) {
            console.error(`Global API Failed: ${globalRes.status} ${globalRes.statusText}`);
            throw new Error(`Global API Failed: ${globalRes.status}`);
        }
        if (!coinsRes.ok) {
            console.error(`Coins API Failed: ${coinsRes.status} ${coinsRes.statusText}`);
            throw new Error(`Coins API Failed: ${coinsRes.status}`);
        }

        const globalData = await globalRes.json();
        const coinsData = await coinsRes.json();
        const gasData = await gasRes.json();

        // คำนวณ Gas
        let gasGwei = 0;
        if (gasData.result) {
            gasGwei = parseInt(gasData.result, 16) / 1e9;
        }

        // ✅ ส่งกลับก้อนเดียวจบ (Combined Response)
        return NextResponse.json({
            // ส่วน Header
            marketCap: globalData.data.total_market_cap.usd,
            marketCapChange: globalData.data.market_cap_change_percentage_24h_usd,
            volume: globalData.data.total_volume.usd,
            btcDominance: globalData.data.market_cap_percentage.btc,
            gasPrice: gasGwei,
            // ส่วน Table & Highlights
            coins: coinsData
        });

    } catch (error: any) {
        console.error('Market API Error:', error);

        // ⚠️ Fallback to Mock Data (CoinGecko Free Tier Rate Limit)
        return NextResponse.json(MOCK_MARKET_DATA);
    }
}