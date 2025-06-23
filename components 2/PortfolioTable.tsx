"use client";
import { useEffect, useState, useRef } from "react";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices, EnrichedToken } from "@/lib/enrichWithPrices";

export default function PortfolioTable() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const tokensRef = useRef<EnrichedToken[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const raw = await getSheetTokens();
        const enriched = await enrichWithPrices(raw);
        setTokens(enriched);
        tokensRef.current = enriched;
      } catch (err) {
        console.error("Error loading tokens:", err);
      }
    }

    async function refreshPrices() {
      console.log("🔁 Refreshing prices...");
      const updated = await Promise.all(
        tokensRef.current.map(async (token) => {
          try {
            const res = await fetch(
              `/api/dexscreener?chain=${token.chain}&contract=${token.contract}`
            );
            const json = await res.json();
            const price = parseFloat(json?.pair?.priceUsd || "0");
            const value = price * token.totalQty;
            const pnl =
              token.totalEntry > 0
                ? ((price - token.totalEntry) / token.totalEntry) * 100
                : 0;
            return { ...token, price, value, pnl };
          } catch {
            return token;
          }
        })
      );
      setTokens(updated);
      tokensRef.current = updated;
    }

    load();
    const interval = setInterval(refreshPrices, 10000); // 🔄 ทุก 10 วินาที
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="p-4">
      <h2 className="text-xl font-bold mb-4">Portfolio Overview</h2>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-2 py-1">Name</th>
            <th className="border border-gray-300 px-2 py-1">Chain</th>
            <th className="border border-gray-300 px-2 py-1">Price</th>
            <th className="border border-gray-300 px-2 py-1">Total Qty</th>
            <th className="border border-gray-300 px-2 py-1">Total Entry</th>
            <th className="border border-gray-300 px-2 py-1">Value (USD)</th>
            <th className="border border-gray-300 px-2 py-1">PnL (%)</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.contract}>
              <td className="border px-2 py-1">{t.name}</td>
              <td className="border px-2 py-1">{t.chain}</td>
              <td className="border px-2 py-1">${t.price.toFixed(4)}</td>
              <td className="border px-2 py-1">{t.totalQty}</td>
              <td className="border px-2 py-1">{t.totalEntry}</td>
              <td className="border px-2 py-1">${t.value.toFixed(2)}</td>
              <td className="border px-2 py-1">{t.pnl.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
