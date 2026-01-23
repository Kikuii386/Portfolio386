// lib/market-service.ts
import { getFromCache, setToCache } from '@/lib/redisCache';

const CACHE_KEY = 'market:global-data';
const CACHE_TTL = 21600; // 6 ชั่วโมง

// 🛠️ Header พิเศษเพื่อแก้ปัญหา CoinGecko ส่ง HTML กลับมา
const CG_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export interface MarketData {
    marketCap: number;
    marketCapChange: number;
    volume: number;
    btcDominance: number;
    gasPrice: {
        eth: number;
        sol: number;
    };
    coins: any[];
    lastUpdated: string;
}

export async function getMarketData(forceRefresh: boolean = false): Promise<MarketData | null> {
    if (!forceRefresh) {
        const cached = await getFromCache<MarketData>(CACHE_KEY);
        if (cached && typeof cached.gasPrice === 'object') {
            console.log('⚡ [Market] Serving from Redis Cache');
            return cached;
        }
    }

    console.log('🔄 [Market] Fetching Fresh Data from APIs...');

    try {
        const [globalRes, coinsRes, ethGasRes, solGasRes] = await Promise.all([
            // 2.1 Global Data (ใส่ Header แก้ HTML)
            fetch('https://api.coingecko.com/api/v3/global', {
                headers: CG_HEADERS,
                cache: 'no-store'
            }),
            // 2.2 Top 50 Coins (ใส่ Header แก้ HTML)
            fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d', {
                headers: CG_HEADERS,
                cache: 'no-store'
            }),
            // 2.3 ETH Gas Price
            fetch('https://ethereum.publicnode.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
                cache: 'no-store'
            }),
            // 2.4 SOL Gas Price (Alchemy)
            fetch('https://solana-mainnet.g.alchemy.com/v2/xGT7Yqz9EMwjE8yF4pSjiO3CDG9925hj', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: "getRecentPrioritizationFees", params: [[]] }),
                cache: 'no-store'
            })
        ]);

        // 🔍 Debug: เช็คว่า API ไหนพัง
        if (!globalRes.ok) {
            const text = await globalRes.text(); // อ่าน error html ดูว่าคืออะไร
            console.error('Global API Error Body:', text.slice(0, 200)); // ปริ้นออกมาดูนิดหน่อย
            throw new Error(`Global API Error: ${globalRes.status}`);
        }
        if (!coinsRes.ok) {
            const text = await coinsRes.text();
            console.error('Coins API Error Body:', text.slice(0, 200));
            throw new Error(`Coins API Error: ${coinsRes.status}`);
        }

        const globalJson = await globalRes.json();
        const coinsJson = await coinsRes.json();
        const ethGasJson = await ethGasRes.json();
        const solGasJson = await solGasRes.json();

        // --- ETH Gas ---
        let ethGwei = 0;
        if (ethGasJson.result) {
            ethGwei = parseInt(ethGasJson.result, 16) / 1e9;
        }

        // --- SOL Gas ---
        let solFeeSOL = 0.000005;
        if (solGasJson.result && Array.isArray(solGasJson.result)) {
            const recentFees = solGasJson.result.slice(-20).map((r: any) => r.prioritizationFee);
            const avgPriority = recentFees.length > 0
                ? recentFees.reduce((a: number, b: number) => a + b, 0) / recentFees.length
                : 0;
            solFeeSOL = (5000 + avgPriority) / 1e9;
        }

        const result: MarketData = {
            marketCap: globalJson.data.total_market_cap.usd,
            marketCapChange: globalJson.data.market_cap_change_percentage_24h_usd,
            volume: globalJson.data.total_volume.usd,
            btcDominance: globalJson.data.market_cap_percentage.btc,
            gasPrice: {
                eth: ethGwei,
                sol: solFeeSOL
            },
            coins: coinsJson,
            lastUpdated: new Date().toISOString()
        };

        await setToCache(CACHE_KEY, result, CACHE_TTL);
        console.log('✅ [Market] Cache Updated');

        return result;

    } catch (error) {
        console.error('❌ [Market] Fetch Error:', error);
        const stale = await getFromCache<MarketData>(CACHE_KEY);
        if (stale) return stale;
        return null;
    }
}