import { NextResponse } from 'next/server';

// 🌟 1. เพิ่มแหล่งดึงข้อมูล Token List ให้ครบทุกเชน EVM
const TOKEN_SOURCES = {
    ethereum: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    bsc: 'https://tokens.pancakeswap.finance/pancakeswap-extended.json',
    polygon: 'https://unpkg.com/quickswap-default-token-list@1.0.91/build/quickswap-default.tokenlist.json',
    arbitrum: 'https://bridge.arbitrum.io/token-list-42161.json',
    base: 'https://raw.githubusercontent.com/base-org/token-list/main/tokens.json',
    optimism: 'https://static.optimism.io/optimism.tokenlist.json',
    linea: 'https://raw.githubusercontent.com/Consensys/linea-token-list/main/tokens/linea-mainnet.json',
    blast: 'https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/blast.json',
    avalanche: 'https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/avalanche.json',
    zksync: 'https://raw.githubusercontent.com/MatterLabs/token-list/main/tokens/zksync-era.json',
    // สำหรับเชนใหม่จัดๆ (Sonic, Abstract, Berachain, Hyperliquid) 
    // ถ้ายังไม่มี Official List ให้ใช้ Li.Fi หรือพึ่งพา Default Token จาก 0x ไปก่อน
    sonic: 'https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/fantom.json', // ใช้ Fantom แทนชั่วคราวได้
    solana: 'https://token.jup.ag/strict',
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
    hyperliquid: 998,
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
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error('Failed to fetch external token list');

        const data = await res.json();
        let formattedTokens = [];

        if (chain === 'solana') {
            formattedTokens = data.map((t: any) => ({
                symbol: t.symbol,
                name: t.name,
                address: t.address,
                decimals: t.decimals,
                logo: optimizeLogoUrl(t.logoURI),
                chainId: 0
            }));
        } else {
            // ✅ ดึง Chain ID จาก Map ที่เราทำไว้
            const targetChainId = CHAIN_ID_MAP[chain] || 1;

            // บาง Token List เก็บโครงสร้างต่างกัน (บางที่ data.tokens, บางที่ data ตรงๆ)
            const tokensArray = data.tokens || (Array.isArray(data) ? data : []);

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