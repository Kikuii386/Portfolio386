// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices } from "@/lib/enrichWithPrices";

interface TokenData {
  token: string;
  entryPrice?: number;
  qty?: number;
  invest?: number;
  price: number;
  amount: number;
  value: number;
  group: string;
}

export default function PortfolioPage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [view, setView] = useState("TOTAL");
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const tokensFromSheet = await getSheetTokens();
      console.log("🧾 tokensFromSheet", tokensFromSheet);

      const enriched = await enrichWithPrices(tokensFromSheet);
      console.log("💰 enriched", enriched);
      if (!Array.isArray(enriched)) throw new Error("Expected array from enrichWithPrices");
      setTokens(enriched);
    } catch (error) {
      console.error("Error fetching tokens or enriching with prices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const partialData = e.detail;
      setTokens(partialData);
    };

    window.addEventListener("enrichUpdate", handleUpdate);
    fetchTokens();

    return () => window.removeEventListener("enrichUpdate", handleUpdate);
  }, []);

  if (!Array.isArray(tokens)) {
    console.error("Expected tokens to be an array");
    return null;
  }
  const filtered = tokens.filter((row) => {
    const match = true; // ยังไม่มี search term ใช้กรอง
    if (!match) return false;
    if (view === "HIGH") return row.group === "HIGH" && row.invest > 0;
    if (view === "LOW") return row.group === "LOW" && row.invest > 0;
    return row.group === "TOTAL" && row.invest > 0;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Your Portfolio</h1>
      <div className="mb-4">
        <label htmlFor="group-select" className="mr-2 font-medium">
          View:
        </label>
        <select
          id="group-select"
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="TOTAL">Total</option>
          <option value="HIGH">High</option>
          <option value="LOW">Low</option>
        </select>
      </div>
      {loading ? (
        <p>Loading portfolio...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-amber-100 text-gray-700">
                <th className="py-2 px-4 text-left">Token</th>
                <th className="py-2 px-4 text-left">Entry Price</th>
                <th className="py-2 px-4 text-left">Quantity</th>
                <th className="py-2 px-4 text-left">Investment</th>
                <th className="py-2 px-4 text-left">Price</th>
                <th className="py-2 px-4 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 px-4">{token.token}</td>
                  <td className="py-2 px-4">
                    {token.entryPrice !== undefined
                      ? `$${token.entryPrice.toFixed(4)}`
                      : "-"}
                  </td>
                  <td className="py-2 px-4">
                    {token.qty !== undefined ? token.qty.toFixed(2) : "-"}
                  </td>
                  <td className="py-2 px-4">
                    {token.invest !== undefined
                      ? `$${token.invest.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="py-2 px-4">${token.price.toFixed(4)}</td>
                  <td className="py-2 px-4 text-emerald-600 font-semibold">
                    ${token.value.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
