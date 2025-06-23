import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get('chain');
  const contract = searchParams.get('contract');

  if (!chain || !contract) {
    return NextResponse.json({ error: 'Missing chain or contract' }, { status: 400 });
  }

  const apiUrl = `https://api.dexscreener.com/latest/dex/search/?q=${contract}`;
  const res = await fetch(apiUrl);

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch from Dexscreener' }, { status: 500 });
  }

  const json = await res.json();
  const pair = json.pairs.find((p: any) =>
    p.chainId.toLowerCase().includes(chain.toLowerCase())
  );

  return NextResponse.json({ pair });
}