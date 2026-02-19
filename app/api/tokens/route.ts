import { NextResponse } from 'next/server';

const TOKEN_SOURCES = {
    ethereum: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    base: 'https://raw.githubusercontent.com/base-org/token-list/main/tokens.json',
    solana: 'https://token.jup.ag/strict',
};

// 🌟 เพิ่มฟังก์ชันนี้เพื่ออัปเกรดความชัดของรูป
const optimizeLogoUrl = (url?: string) => {
    if (!url) return null;
    let optimizedUrl = url;

    // 1. ถ้าเป็นลิงก์ CoinGecko ไซส์ /thumb/ (จิ๋วมาก) ให้เปลี่ยนเป็น /large/ (ชัดจัดเต็ม)
    if (optimizedUrl.includes('coingecko.com') && optimizedUrl.includes('/thumb/')) {
        optimizedUrl = optimizedUrl.replace('/thumb/', '/large/');
    }

    // 2. ถ้าเป็นลิงก์ ipfs:// ตรงๆ เบราว์เซอร์ปกติจะเปิดไม่ได้/โหลดช้า ให้แปลงเป็น HTTP Gateway
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
                // ✅ เรียกใช้ฟังก์ชันแปลงรูปที่นี่
                logo: optimizeLogoUrl(t.logoURI),
                chainId: 0
            }));
        } else {
            const targetChainId = chain === 'ethereum' ? 1 : chain === 'base' ? 8453 : 1;

            if (data.tokens) {
                formattedTokens = data.tokens
                    .filter((t: any) => t.chainId === targetChainId)
                    .map((t: any) => ({
                        symbol: t.symbol,
                        name: t.name,
                        address: t.address,
                        decimals: t.decimals,
                        // ✅ เรียกใช้ฟังก์ชันแปลงรูปที่นี่
                        logo: optimizeLogoUrl(t.logoURI),
                        chainId: t.chainId
                    }));
            }
        }

        return NextResponse.json(formattedTokens, { status: 200 });

    } catch (error) {
        console.error('Token Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }
}