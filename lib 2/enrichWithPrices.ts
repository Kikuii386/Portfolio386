import type { TokenRow } from "./getSheetTokens";

export type EnrichedToken = TokenRow & {
  price: number;
  value: number;
  pnl: number;
};

export async function enrichWithPrices(
  tokens: TokenRow[]
): Promise<EnrichedToken[]> {
  const enriched = await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(
          `/api/dexscreener?chain=${token.chain}&contract=${token.contract}`
        );
        const json = await res.json();
        const price = parseFloat(json?.pair?.priceUsd || "0");
        const qty = token.totalQty;
        const entry = token.totalEntry;
        const value = price * qty;
        const pnl = entry > 0 ? ((price - entry) / entry) * 100 : 0;

        return { ...token, price, value, pnl };
      } catch (err) {
        console.error(`Failed to enrich ${token.name}`, err);
        return { ...token, price: 0, value: 0, pnl: 0 };
      }
    })
  );

  return enriched;
}
