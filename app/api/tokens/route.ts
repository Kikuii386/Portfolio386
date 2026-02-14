import { NextResponse } from 'next/server';

// URL ของ Token List ต้นทาง
const TOKEN_SOURCES = {
    ethereum: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    base: 'https://raw.githubusercontent.com/base-org/token-list/main/tokens.json',
    solana: 'https://token.jup.ag/strict', // Jupiter Strict List (JSON Array)
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain'); // รับค่า chain เช่น 'ethereum', 'base', 'solana'

    if (!chain || !TOKEN_SOURCES[chain as keyof typeof TOKEN_SOURCES]) {
        return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
    }

    const targetUrl = TOKEN_SOURCES[chain as keyof typeof TOKEN_SOURCES];

    try {
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error('Failed to fetch external token list');

        const data = await res.json();
        let formattedTokens = [];

        // --- จัดการ Data Normalization (แปลงให้หน้าบ้านใช้ง่ายๆ) ---

        if (chain === 'solana') {
            // Solana (Jupiter) ส่งมาเป็น Array เลย
            formattedTokens = data.map((t: any) => ({
                symbol: t.symbol,
                name: t.name,
                address: t.address,
                decimals: t.decimals,
                logo: t.logoURI,
                chainId: 0
            }));
        } else {
            // EVM (Uniswap Standard) ส่งมาเป็น Object { tokens: [...] }
            // ต้องกรอง Chain ID ให้ตรงด้วย
            const targetChainId = chain === 'ethereum' ? 1 : chain === 'base' ? 8453 : 1;

            if (data.tokens) {
                formattedTokens = data.tokens
                    .filter((t: any) => t.chainId === targetChainId)
                    .map((t: any) => ({
                        symbol: t.symbol,
                        name: t.name,
                        address: t.address,
                        decimals: t.decimals,
                        logo: t.logoURI,
                        chainId: t.chainId
                    }));
            }
        }

        // ส่งกลับเฉพาะ Array ของ Token ล้วนๆ หน้าบ้านจะได้ไม่ต้องเขียน Logic เยอะ
        return NextResponse.json(formattedTokens, { status: 200 });

    } catch (error) {
        console.error('Token Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }
}