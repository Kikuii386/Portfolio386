// lib/getsheettoken.ts

export type TokenRow = {
  name: string;
  chain: string;
  cmcchain: string;
  contract: string;
  highEntry: number;
  highQty: number;
  highInv: number;
  lowEntry: number;
  lowQty: number;
  lowInv: number;
  totalEntry: number;
  totalQty: number;
  totalInv: number;
  otherEntry: number;
  otherQty: number;
  otherInv: number;
  freeEntry: number;
  freeQty: number;
  freeInv: number;
  cmcId: string;
  cmcSlug: string;
  geckoId: string;
  logo: string;
  allocationPct: number;
  gsLink: string;
  freeGsLink?: string;
};

export async function getSheetTokens(): Promise<TokenRow[]> {
  const url = process.env.GSHEETS_TOKEN_ENDPOINT;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error('Failed to fetch data from Google Sheet');

  const data = await res.json();

  // 🔥 เพิ่ม Log ดักจับผู้ร้ายตรงนี้ครับ
  const spx = (data as any[]).find(
    (t) => t.name === 'SPXETH' || t.symbol === 'SPXETH'
  );
  console.log('🔍 CHECK GOOGLE DATA:', {
    symbol: spx?.name,
    totalInv: spx?.totalInv,
    lowInv: spx?.lowInv,
    otherInv: spx?.otherInv,
  });

  return data as TokenRow[];
}
