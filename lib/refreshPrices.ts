import { EnrichedToken } from '@/lib/enrichWithPrices';

const PRICE_API_BASE =
  process.env.NEXT_PUBLIC_PRICE_API_BASE ??
  'https://cron-price-fetcher.onrender.com';

type ApiPriceRow = {
  chain: string;
  address: string;
  priceUsd?: number | null;
  price_usd?: number | null;
  symbol?: string | null;
  source?: string | null;
  priceChangeH24?: number | null;
  price_change_h24?: number | null;
  marketCap?: number | null;
  market_cap?: number | null;
};

async function loadPriceMap(): Promise<Map<string, ApiPriceRow>> {
  try {
    const res = await fetch(`${PRICE_API_BASE}/prices`, { cache: 'no-store' });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn(
        '[refreshPrices] failed to load /prices',
        res.status,
        txt.slice(0, 200)
      );
      return new Map();
    }
    const data = (await res.json()) as any;
    const rows: ApiPriceRow[] = (data.prices ??
      data.rows ??
      []) as ApiPriceRow[];
    const map = new Map<string, ApiPriceRow>();
    for (const r of rows) {
      if (!r || !r.chain || !r.address) continue;
      const key = `${String(r.chain).toLowerCase()}:${String(
        r.address
      ).toLowerCase()}`;
      map.set(key, r);
    }
    console.log('[refreshPrices] loaded price rows:', map.size);
    return map;
  } catch (e) {
    console.error('[refreshPrices] loadPriceMap error', e);
    return new Map();
  }
}

export async function refreshPrices(
  allData: (EnrichedToken & { contract: string; chain: string })[],
  oldPrices: Record<string, number>
): Promise<{ updatedTokens: typeof allData; changedContracts: string[] }> {
  console.log(
    '🔄 Starting refreshPrices cycle via webhook backend (/prices)...'
  );

  const filtered = allData.filter((row) => !!row.contract && !!row.chain);
  const changedContracts: string[] = [];
  const updatedTokens: typeof allData = [];

  // โหลดราคาทั้งหมดจาก Cron Price Fetcher (ซึ่งถูก cron/webhook อัปเดตไว้แล้ว)
  const priceMap = await loadPriceMap();

  for (const row of filtered) {
    const priceKey = `${row.chain.toLowerCase()}:${row.contract.toLowerCase()}`;
    const p = priceMap.get(priceKey);

    if (!p) {
      updatedTokens.push(row);
      continue;
    }

    const rawPrice = p.priceUsd ?? p.price_usd;
    if (rawPrice == null) {
      updatedTokens.push(row);
      continue;
    }

    const newPrice =
      typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

    if (!Number.isFinite(newPrice)) {
      updatedTokens.push(row);
      continue;
    }

    const rawChange = p.priceChangeH24 ?? p.price_change_h24;
    const rawMcap = p.marketCap ?? p.market_cap;

    const newChange =
      typeof rawChange === 'number' ? rawChange : row.priceChangeH24; // ถ้าไม่มีใหม่ ใช้ค่าเดิม
    const newMcap = typeof rawMcap === 'number' ? rawMcap : row.marketCap; // ถ้าไม่มีใหม่ ใช้ค่าเดิม
    const key = row.contract.toLowerCase();
    const old = oldPrices[key];
    const threshold = Math.max(1e-12, newPrice * 0.0001); // 0.01%

    if (Math.abs((old ?? 0) - newPrice) > threshold) {
      oldPrices[key] = newPrice;
      if (!changedContracts.includes(key)) changedContracts.push(key);

      updatedTokens.push({
        ...row,
        currentPrice: newPrice,
        priceChangeH24: newChange,
        marketCap: newMcap,
      });
    } else {
      // 🛠️ แก้ไขตรงนี้: ต้องใส่ currentPrice ไปด้วย แม้ราคาจะไม่เปลี่ยน
      // เพราะ 'row' ที่รับมาจาก Frontend มันไม่มีราคาติดมาแล้ว (เป็น minimal payload)
      updatedTokens.push({
        ...row,
        currentPrice: newPrice, // ✅ เพิ่มบรรทัดนี้ครับ!
        priceChangeH24: newChange,
        marketCap: newMcap,
      });
    }
  }

  console.log(
    `✅ Refresh complete (webhook-backed). Changed: ${changedContracts.length}`
  );
  return { updatedTokens, changedContracts };
}
