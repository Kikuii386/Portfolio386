// lib/fetchPrice.ts
import { DEXSCREENER_PROXIES } from "@/lib/apiConfig";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TIMEOUT_MS = 5000;

export async function fetchPrice(
  contract: string,
  chain: string,
): Promise<number | null> {
  const addr = contract.toLowerCase();

  const tryFetch = async (base: string): Promise<number | null> => {
    const batchUrl = `${base}?contracts=${encodeURIComponent(addr)}`;
    const singleUrl = `${base}?contract=${encodeURIComponent(addr)}`;

    const withTimeout = async (url: string) => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0",
          },
          cache: "no-store",
          signal: ctrl.signal,
        });
        return res;
      } finally {
        clearTimeout(to);
      }
    };

    let res = await withTimeout(batchUrl);
    if (!res.ok) {
      res = await withTimeout(singleUrl);
    }

    if (!res.ok) return null;

    try {
      const json = await res.json();
      const pairs = Array.isArray(json?.pairs) ? json.pairs : [];
      if (!pairs.length) return null;

      const hit =
        pairs.find(
          (p: any) => p?.baseToken?.address?.toLowerCase?.() === addr,
        ) ?? pairs[0];

      const price = Number(hit?.priceUsd ?? 0);
      return Number.isFinite(price) && price > 0 ? price : null;
    } catch {
      return null;
    }
  };

  for (let i = 0; i < DEXSCREENER_PROXIES.length; i++) {
    const base = DEXSCREENER_PROXIES[i];
    const price = await tryFetch(base);
    if (price !== null) return price;
    if (i < DEXSCREENER_PROXIES.length - 1) await delay(300);
  }

  return null;
}