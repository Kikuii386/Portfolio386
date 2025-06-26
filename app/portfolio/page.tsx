"use client";
import { useEffect, useState } from "react";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices, EnrichedToken } from "@/lib/enrichWithPrices";
import PortfolioTable from "@/components/PortfolioTable";

export default function PortfolioPage() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchAndEnrich = async () => {
      try {
        const sheetData = await getSheetTokens();
        await enrichWithPrices(sheetData, (batch) => {
          if (!cancelled) {
            setTokens((prev) => {
              const seen = new Set(prev.map((t) => t.id));
              const uniqueBatch = batch.filter((t) => !seen.has(t.id));
              return [...prev, ...uniqueBatch];
            });
          }
        });
      } catch (e) {
        setTokens([]);
      }
    };
    fetchAndEnrich();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Your Portfolio</h1>
      <PortfolioTable tokens={tokens} />
    </div>
  );
}