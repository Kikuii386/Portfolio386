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
      {/* 2. ✅ เพิ่มส่วน "Ghost Button" (ปุ่มซ้อนทับ Navbar) ตรงนี้ */}
      {/* จะทำงานเฉพาะตอน isFilterOpen เป็น true */}
      {isFilterOpen && (
        <div className="md:hidden fixed top-0 right-4 h-16 z-[100] flex items-center">
           {/* ใช้ container ความสูง h-16 (64px) เท่า Navbar */}
           {/* right-4 คือระยะห่างจากขอบขวา เท่ากับ padding ของ Navbar */}
           <div className="flex gap-4"> 
             <MenuToggle 
               isOpen={true} // บังคับให้เป็นรูป X ตลอด
               onClick={() => setIsFilterOpen(false)} // กดแล้วปิด Filter
               className="text-earth-cream hover:text-white" 
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
