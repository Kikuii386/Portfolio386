import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contract = searchParams.get('contract');

  if (!contract) {
    const response = NextResponse.json({ error: 'Missing contract' }, { status: 400 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }

  const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${contract}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const text = await res.text(); // อ่านเนื้อหา error
      console.error('Dexscreener response error:', res.status, text);
      const response = NextResponse.json({ error: `Dexscreener failed: ${res.status}` }, { status: res.status });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const data = await res.json();
    const response = NextResponse.json(data);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (err) {
    console.error('Dexscreener fetch error:', err);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}