import type { TokenRow } from "./getSheetTokens";

export type EnrichedToken = TokenRow & {
  currentPrice: number;
  symbol: string;
  logo: string;
  id: string;
};

export async function enrichWithPrices(
  tokens: TokenRow[],
  onBatch?: (results: EnrichedToken[]) => void
): Promise<EnrichedToken[]> {
  const CHUNK_SIZE = 50;
  const DELAY_MS = 1500;

  // กรองเฉพาะ token ที่มี contract และมี qty
  const filtered = tokens
    .filter(t => t.contract && (t.totalQty > 0 || t.highQty > 0 || t.lowQty > 0))
    .filter((token, index, self) =>
      index === self.findIndex(t => t.contract === token.contract)
    );

  const chunks = [...Array(Math.ceil(filtered.length / CHUNK_SIZE))].map((_, i) =>
    filtered.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE)
  );

  let results: EnrichedToken[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const fetches = chunk.map(async (row) => {
      try {
        const res = await fetch(`/api/dexscreener?contract=${row.contract}`);
        if (!res.ok) {
          console.warn(`[BLOCKED] ${row.contract} → Status: ${res.status}`);
          return null;
        }

        const json = await res.json();
        const info = json.pairs?.[0];
        if (!info || !info.priceUsd) {
          console.warn(`[NOT FOUND] ${row.contract} on ${row.chain}`);
          return null;
        }

        const currentPrice = parseFloat(info.priceUsd);
        const symbol = info.baseToken?.symbol || "";
        const logo =
          info.baseToken?.logoURI ||
          info.imageUrl ||
          info.info?.imageUrl ||
          "https://via.placeholder.com/32";

        return {
          ...row,
          currentPrice,
          symbol,
          logo,
          id: `${row.contract}-${row.chain}`,
        };
      } catch (e) {
        console.error("Error fetching price for", row.contract, e);
        return null;
      }
    });

    const settled = await Promise.all(fetches);
    const chunkResults = settled.filter((r): r is EnrichedToken => Boolean(r));

    const newResults = chunkResults.filter(t => {
      const key = `${t.contract}-${t.chain}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    results = results.concat(newResults);

    if (onBatch) onBatch([...results]);

    if (chunk !== chunks[chunks.length - 1]) {
      const delay = DELAY_MS + Math.random() * 500;
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  return results;
}