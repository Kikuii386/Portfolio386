"use client";
import { useEffect, useState } from "react";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices, EnrichedToken } from "@/lib/enrichWithPrices";

export default function PortfolioTable() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [type, setType] = useState<'total' | 'high' | 'low'>('total');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const raw = await getSheetTokens();
        const enriched = await enrichWithPrices(raw);
        setTokens(enriched);
      } catch (err) {
        console.error("Error loading tokens:", err);
      }
    }
    load();
  }, []);

  const filtered = tokens.filter((row) => {
    const match = !searchTerm ||
      (row.name && row.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.contract && row.contract.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!match) return false;
    if (type === 'high') return row.highInv > 0;
    if (type === 'low') return row.lowInv > 0;
    return row.totalInv > 0;
  });

  return (
    <section className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 items-center">
        <h2 className="text-xl font-bold mb-2 md:mb-0">Your Portfolio</h2>
        <div className="flex space-x-2 mb-2 md:mb-0">
          {['total', 'high', 'low'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t as any)}
              className={`px-4 py-2 rounded-md border ${type === t ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or contract"
          className="border rounded px-2 py-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Logo</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Entry</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Value</th>
            <th className="border px-2 py-1">PnL</th>
            <th className="border px-2 py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t, index) => {
            const entry = type === 'high' ? t.highEntry : type === 'low' ? t.lowEntry : t.totalEntry;
            const qty = type === 'high' ? t.highQty : type === 'low' ? t.lowQty : t.totalQty;
            const inv = type === 'high' ? t.highInv : type === 'low' ? t.lowInv : t.totalInv;
            const value = t.currentPrice * qty;
            const pnl = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;

            return (
              <tr key={t.contract} className="text-center">
                <td className="border px-2 py-1">{index + 1}</td>
                <td className="border px-2 py-1">
                  <img src={t.logo} alt="logo" className="w-6 h-6 inline-block rounded-full" />
                </td>
                <td className="border px-2 py-1">{t.symbol || t.name}</td>
                <td className="border px-2 py-1">{entry.toFixed(6)}</td>
                <td className="border px-2 py-1">{qty}</td>
                <td className="border px-2 py-1">${value.toFixed(2)}</td>
                <td className={`border px-2 py-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnl.toFixed(2)}%</td>
                <td className="border px-2 py-1">${t.currentPrice.toFixed(6)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}