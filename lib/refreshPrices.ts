// lib/refreshPrices.ts
import { EnrichedToken } from "@/lib/enrichWithPrices"

export function refreshPrices(
  allData: (EnrichedToken & { contract: string })[],
  oldPrices: Record<string, number>
): void {
  allData.forEach((row) => {
    const old = oldPrices[row.contract];
    const newPrice = row.currentPrice;
    if (old !== undefined && old !== newPrice) {
      console.log(`🔁 Price update for ${row.name}: ${old} → ${newPrice}`);
      oldPrices[row.contract] = newPrice;
    }
  });
}