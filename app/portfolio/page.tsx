"use client";
import { useEffect, useState, useRef } from "react";
import type { EnrichedToken } from "@/lib/enrichWithPrices";
import PortfolioTable from "@/components/PortfolioTable";


export default function PortfolioPage() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/enrich");
        const data = await res.json();
        setTokens(data ?? []);
      } catch (err) {
        console.error("❌ Failed to fetch enriched tokens:", err);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  return (
    <section className="py-12" id="portfolio">
       <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">Your Portfolio</h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Track your asset performance in real-time
            </p>
          </div>
        </div>
        <PortfolioTable tokens={tokens} loading={loading} />
      </div>
    </section>
  );
}