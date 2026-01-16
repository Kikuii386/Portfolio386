import type { TokenRow } from './getSheetTokens';
import { getFromCache, setToCache } from '@/lib/redisCache';

import crypto from 'crypto';

const PRICE_API_BASE = process.env.NEXT_PUBLIC_PRICE_API_BASE;

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
    const res = await fetch(`${PRICE_API_BASE}/prices`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(
        '[enrichWithPrices] failed to load /prices',
        res.status,
        await res.text().catch(() => '')
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
    console.log('[enrichWithPrices] loaded price rows:', map.size);
    return map;
  } catch (e) {
    console.error('[enrichWithPrices] loadPriceMap error', e);
    return new Map();
  }
}

export type EnrichedToken = TokenRow & {
  currentPrice: number;
  symbol: string;
  logo: string;
  id: string;
  priceChangeH24?: number | null;
  marketCap?: number | null;
};

function hashTokens(tokens: TokenRow[]): string {
  const json = JSON.stringify(
    tokens.map((t) => ({
      contract: t.contract,
      totalQty: t.totalQty,
      highQty: t.highQty,
      lowQty: t.lowQty,
      chain: t.chain,
    }))
  );
  return crypto.createHash('sha256').update(json).digest('hex');
}

export async function enrichWithPrices(
  tokens: TokenRow[],
  onBatch?: (results: EnrichedToken[]) => void,
  forceRefresh: boolean = false
): Promise<EnrichedToken[]> {
  console.log('🧩 ENRICH START');
  console.log('📦 input length:', tokens.length);

  const enrichCache = new Map<string, any>();

  const CHUNK_SIZE = 100;
  const DELAY_MS = 1000;

  // --- Fast path: try to serve entirely from cache without hitting PRICE_API_BASE ---
  const currentHash = hashTokens(tokens);
  const cachedHash = await getFromCache('sheet:hash');

  if (!forceRefresh && cachedHash === currentHash) {
    const cachedEnriched = await getFromCache('sheet:enrichedTokens');
    if (cachedEnriched) {
      const enriched = cachedEnriched as EnrichedToken[];
      console.log(`🧊 Loaded from cache: ${enriched.length} tokens`);
      if (onBatch) onBatch(enriched);
      return enriched;
    }
  }

  if (onBatch) onBatch([]);

  // Only load price map when we actually need to enrich (cache miss or stale data)
  const priceMap = await loadPriceMap();

  // กรองเฉพาะ token ที่มี contract และมี qty
  const filtered = tokens
    .filter(
      (t) =>
        t.contract &&
        (t.totalQty > 0 ||
          t.highQty > 0 ||
          t.lowQty > 0 ||
          t.otherQty > 0 ||
          t.freeQty > 0)
    )
    .filter(
      (token, index, self) =>
        index === self.findIndex((t) => t.contract === token.contract)
    );

  const chunks = [...Array(Math.ceil(filtered.length / CHUNK_SIZE))].map(
    (_, i) => filtered.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE)
  );

  let results: EnrichedToken[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const fetches = chunk.map(async (row) => {
      const key = `${row.contract}-${row.chain}`;
      if (enrichCache.has(key)) {
        return enrichCache.get(key);
      }

      const priceKey = `${row.chain.toLowerCase()}:${row.contract.toLowerCase()}`;
      const p = priceMap.get(priceKey);

      if (!p) {
        console.warn(
          `[NOT FOUND] ${row.contract} on ${row.chain} (no price row)`
        );
        return null;
      }

      const rawPrice = p.priceUsd ?? p.price_usd;
      if (rawPrice == null) {
        console.warn(
          `[NO PRICE] ${row.contract} on ${row.chain} (row present but price missing)`
        );
        return null;
      }

      const numericPrice =
        typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

      if (!Number.isFinite(numericPrice)) {
        console.warn(
          `[INVALID PRICE] ${row.contract} on ${row.chain} →`,
          rawPrice
        );
        return null;
      }

      const rawChange = p.priceChangeH24 ?? p.price_change_h24;
      const rawMcap = p.marketCap ?? p.market_cap;

      const currentPrice = numericPrice;
      const symbol =
        (p.symbol && p.symbol.trim().length > 0 ? p.symbol : row.name) ||
        'UNKNOWN';

      const logo =
        typeof row.logo === 'string' && row.logo.trim().length > 0
          ? row.logo
          : 'https://via.placeholder.com/32';

      const enrichedToken = {
        ...row,
        currentPrice,
        symbol,
        logo,
        id: key,
        priceChangeH24: typeof rawChange === 'number' ? rawChange : null,
        marketCap: typeof rawMcap === 'number' ? rawMcap : null,
      };
      enrichCache.set(key, enrichedToken);
      return enrichedToken;
    });

    const settled = await Promise.all(fetches);
    const chunkResults = settled.filter((r): r is EnrichedToken => Boolean(r));

    const newResults = chunkResults.filter((t) => {
      const key = `${t.contract}-${t.chain}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    results = results.concat(newResults);

    // Removed per-batch onBatch call to ensure only final call after all enrichment

    if (chunk !== chunks[chunks.length - 1]) {
      const delay = DELAY_MS + Math.random() * 200;
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  await setToCache('sheet:enrichedTokens', results, 86400);
  await setToCache('sheet:hash', currentHash, 86400);

  console.log(`✅ Enriched tokens: ${results.length}`);
  console.log(`❌ Not found or failed: ${filtered.length - results.length}`);
  return results;
}
