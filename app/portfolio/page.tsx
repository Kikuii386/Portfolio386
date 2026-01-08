'use client';
import { useEffect, useState, useRef } from 'react';
import type { EnrichedToken } from '@/lib/enrichWithPrices';
import PortfolioTable from '@/components/PortfolioTable';
import MenuToggle from '@/components/ui/MenuToggle';


export default function PortfolioPage() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [animateX, setAnimateX] = useState(false);
  const [showGhost, setShowGhost] = useState(false);

useEffect(() => {
    if (isFilterOpen) {
      setShowGhost(true); 
      const timer = setTimeout(() => setAnimateX(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateX(false); 
      const timer = setTimeout(() => {
        setShowGhost(false); 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFilterOpen]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchTokens = async () => {
      try {
        const res = await fetch('/api/enrich');
        const data = await res.json();
        setTokens(data ?? []);
      } catch (err) {
        console.error('❌ Failed to fetch enriched tokens:', err);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  return (
    <section className="py-12" id="portfolio">

      {showGhost && (
        <div className="md:hidden fixed top-0 right-4 h-16 z-[100] flex items-center">

           <div className="flex gap-4"> 
             <MenuToggle 
               isOpen={animateX} 
               onClick={() => setIsFilterOpen(false)} 
               className="text-earth-cream hover:text-white p-1 bg-gradient-to-br from-earth-darkbrown to-earth-brown rounded-lg" 
             />
           </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">
              Your Portfolio
            </h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Track your asset performance in real-time
            </p>
          </div>
        </div>
        <PortfolioTable 
          tokens={tokens} 
          loading={loading} 
          // เพิ่ม 2 บรรทัดนี้ครับ
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />
      </div>
    </section>
  );
}
