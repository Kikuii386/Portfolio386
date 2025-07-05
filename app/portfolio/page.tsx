"use client";
import { useEffect, useState } from "react";
import { getSheetTokens } from "@/lib/getSheetTokens";
import { enrichWithPrices, EnrichedToken } from "@/lib/enrichWithPrices";
import PortfolioTable from "@/components/PortfolioTable";
import Tooltip from "@/components/ui/TooltipCopy";

export default function PortfolioPage() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <section className="py-12" id="portfolio">
       <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">Your Portfolio</h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Overview of your crypto portfolio performance
            </p>
          </div>
        </div>
        <PortfolioTable tokens={tokens} setCopied={setCopied} />
        {copied && <Tooltip message="Copied!" />}
      </div>
    </section>
  );
}