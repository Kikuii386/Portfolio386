import type { TokenRow } from "./getSheetTokens";

export type EnrichedToken = TokenRow & {
  currentPrice: number;
  symbol: string;
  logo: string;
};

export async function enrichWithPrices(tokens: TokenRow[]): Promise<EnrichedToken[]> {
  const CHUNK_SIZE = 50;
  const DELAY_MS = 1500;

  const chunks = [...Array(Math.ceil(tokens.length / CHUNK_SIZE))].map((_, i) =>
    tokens.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE)
  );

  let results: EnrichedToken[] = [];
  let firstShown = false;

  for (const chunk of chunks) {
    const fetches = chunk.map(async (row) => {
      try {
        const res = await fetch(`/api/dexscreener?contract=${row.contract}`);
        const json = await res.json();
        const info = json.pairs?.[0];

        if (!info || !info.priceUsd) {
          console.warn("⛔ DexScreener ไม่มีข้อมูล:", row.name);
          return null;
        }

        const currentPrice = parseFloat(info.priceUsd);
        const symbol = info.baseToken?.symbol || "";
        const logo =
          info.baseToken?.logoURI ||
          info.imageUrl ||
          info.info?.imageUrl ||
          "https://via.placeholder.com/32";

        return { ...row, currentPrice, symbol, logo };
      } catch (e) {
        console.error("Error fetching price for", row.contract, e);
        return null;
      }
    });

    const chunkResults = (await Promise.all(fetches)).filter(
      (t): t is EnrichedToken => Boolean(t)
    );
    results = results.concat(chunkResults);

    // Emit intermediate results (optional, must be supported in consuming component)
    if (typeof window !== "undefined") {
      const event = new CustomEvent("enrichUpdate", {
        detail: { results },
      });
      window.dispatchEvent(event);
    }

    if (!firstShown && results.length > 0) {
      firstShown = true;
      document.querySelector(".loader")?.parentElement?.parentElement?.parentElement?.remove();
    }

    if (chunk !== chunks[chunks.length - 1]) {
      await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }

  return results;
}
