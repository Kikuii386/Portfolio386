import { NextResponse } from 'next/server';

// 🌟 1. เปลี่ยน URL ของ Solana ให้เป็น API V2 ของ Jupiter (ดึงเฉพาะ Verified Tokens)
const TOKEN_SOURCES = {
    ethereum: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    bsc: 'https://tokens.pancakeswap.finance/pancakeswap-extended.json',
    polygon: 'https://unpkg.com/quickswap-default-token-list@1.0.91/build/quickswap-default.tokenlist.json',
    arbitrum: 'https://tokenlist.arbitrum.io/ArbTokenLists/arbed_arb_whitelist_era.json',
    base: 'https://tokens.coingecko.com/base/all.json',
    optimism: 'https://static.optimism.io/optimism.tokenlist.json',
    linea: 'https://tokens.coingecko.com/linea/all.json',
    blast: 'https://tokens.coingecko.com/blast/all.json',
    avalanche: 'https://tokens.coingecko.com/avalanche/all.json',
    zksync: 'https://tokens.coingecko.com/zksync/all.json',
    abstract: 'https://tokens.coingecko.com/abstract/all.json',
    berachain: 'https://tokens.coingecko.com/berachain/all.json',
    sonic: 'https://tokens.coingecko.com/sonic/all.json',
    // 🔥 แก้ตรงนี้: ใช้ Jupiter Verified API
    solana: 'https://api.jup.ag/tokens/v2/tag?query=verified',
};

// 🌟 2. สร้างแผนผัง Chain ID เพื่อให้ Filter ข้อมูลได้ถูกต้อง
const CHAIN_ID_MAP: Record<string, number> = {
    ethereum: 1,
    bsc: 56,
    polygon: 137,
    arbitrum: 42161,
    base: 8453,
    optimism: 10,
    linea: 59144,
    blast: 81457,
    avalanche: 43114,
    sonic: 146,
    berachain: 80094,
    abstract: 2741,
    zksync: 324
};

const optimizeLogoUrl = (url?: string) => {
    if (!url) return null;
    let optimizedUrl = url;
    if (optimizedUrl.includes('coingecko.com') && optimizedUrl.includes('/thumb/')) {
        optimizedUrl = optimizedUrl.replace('/thumb/', '/large/');
    }
    if (optimizedUrl.startsWith('ipfs://')) {
        optimizedUrl = optimizedUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
    }
    return optimizedUrl;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    if (!chain || !TOKEN_SOURCES[chain as keyof typeof TOKEN_SOURCES]) {
        return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
    }

    const targetUrl = TOKEN_SOURCES[chain as keyof typeof TOKEN_SOURCES];

    try {
        // 🌟 1. สร้าง Headers และดึง JUPITER_API_KEY มาใส่เฉพาะเชน Solana
        const headers: HeadersInit = {};
        if (chain === 'solana') {
            const JUPITER_API_KEY = (process.env.JUPITER_API_KEY || '').trim();
            if (JUPITER_API_KEY) {
                headers['x-api-key'] = JUPITER_API_KEY; // ยื่นกุญแจให้ Jupiter!
            }
        }

        // 🌟 2. แนบ headers เข้าไปใน fetch
        const res = await fetch(targetUrl, { headers });

        if (!res.ok) {
            console.error(`Fetch failed with status: ${res.status}`);
            throw new Error('Failed to fetch external token list');
        }

        const data = await res.json();
        let formattedTokens = [];

        // ✅ ใช้โครงสร้างตรวจสอบแบบเดียวกันหมด 
        const tokensArray = data.tokens || (Array.isArray(data) ? data : []);

        if (chain === 'solana') {
            // ✅ เปลี่ยนการอ่านค่าให้ตรงกับ Jupiter API V2
            formattedTokens = tokensArray.slice(0, 1000).map((t: any) => ({
                symbol: t.symbol,
                name: t.name,
                // 🔥 Jupiter ใช้ 'id' เก็บ Address
                address: t.id || t.address,
                decimals: t.decimals,
                // 🔥 Jupiter ใช้ 'icon' เก็บรูป
                logo: optimizeLogoUrl(t.icon || t.logoURI),
                chainId: 0
            }));
        } else {
            // ✅ EVM ปกติ
            const targetChainId = CHAIN_ID_MAP[chain] || 1;

            formattedTokens = tokensArray
                .filter((t: any) => t.chainId === targetChainId)
                .map((t: any) => ({
                    symbol: t.symbol,
                    name: t.name,
                    address: t.address,
                    decimals: t.decimals,
                    logo: optimizeLogoUrl(t.logoURI || t.iconUrls?.[0]),
                    chainId: t.chainId
                }));
        }

        return NextResponse.json(formattedTokens, { status: 200 });

    } catch (error) {
        console.error('Token Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }
}