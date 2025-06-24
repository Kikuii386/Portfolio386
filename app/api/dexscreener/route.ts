import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contract = searchParams.get('contract');

  if (!contract) {
    return NextResponse.json({ error: 'Missing contract' }, { status: 400 });
  }

  const chain = searchParams.get('chain')?.toUpperCase();
  const apiUrl = chain === 'SOL'
    ? `https://api.dexscreener.com/latest/dex/pairs/solana/${contract}`
    : `https://api.dexscreener.com/latest/dex/search/?q=${contract}`;

  try {
    const res = await fetch(apiUrl);

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from DexScreener' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Dexscreener fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}