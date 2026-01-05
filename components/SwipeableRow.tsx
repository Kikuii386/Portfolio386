import React from 'react';
import { MoreHorizontal, LineChart, FileSpreadsheet, ExternalLink, X, Check, Copy } from 'lucide-react';
import { EnrichedToken } from '@/lib/enrichWithPrices';
import PriceDisplay from '@/components/PriceDisplay';
import QtyDisplay from '@/components/QtyDisplay';
import Tooltip from '@/components/ui/Tooltips';

interface SwipeableRowProps {
  t: EnrichedToken;
  viewMode: string;
  priceChanges: any;
  copy: (text: string, label?: string) => void;
  copiedText: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const SwipeableRow = ({
  t,
  viewMode,
  priceChanges,
  copy,
  copiedText,
  isExpanded,
  onToggle
}: SwipeableRowProps) => {
  // --- Calculation Logic (เหมือนเดิม) ---
  const entry = viewMode === 'high' ? t.highEntry : viewMode === 'low' ? t.lowEntry : viewMode === 'other' ? t.otherEntry : viewMode === 'free' ? t.freeEntry : t.totalEntry;
  const qty = viewMode === 'high' ? t.highQty : viewMode === 'low' ? t.lowQty : viewMode === 'other' ? t.otherQty : viewMode === 'free' ? t.freeQty : t.totalQty;
  const inv = viewMode === 'high' ? t.highInv : viewMode === 'low' ? t.lowInv : viewMode === 'other' ? t.otherInv : viewMode === 'free' ? t.freeInv : t.totalInv;
  const value = t.currentPrice * qty;
  const pnl = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
  // สมมติ allocation คำนวณข้างนอก หรือใส่ placeholder ไว้ก่อน
  const allocation = 0; 
  const profitAmount = value - inv;
  const chg = t.priceChangeH24 ?? 0;
  const chgColor = chg > 0 ? 'text-earth-olive' : chg < 0 ? 'text-red-500' : 'text-earth-stone';

  // ระยะ Slide
  const SLIDE_WIDTH = 160;

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 20 && !isExpanded) onToggle();
      if (e.deltaX < -20 && isExpanded) onToggle();
    }
  };

  // ✅ รวม Content เป็น Array เพื่อนำไป Map ลง td
  // โดยเราจะใส่ Class ให้ตรงกับ Header ของคุณ (px-6 py-4)
  const columns = [
    // 0. Asset (Left)
    {
      content: (
        <div className="flex items-center">
          <img src={t.logo || '/smile.png'} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/smile.png'; }} alt={t.name} className="h-10 w-10 rounded-full border border-earth-cream mr-4" />
          <div className="text-left">
            <div className="font-semibold text-earth-darkbrown">{t.name}</div>
            <Tooltip content="Copy address">
              <div className="inline-flex items-center gap-1.5 cursor-pointer group" onClick={(e) => { e.stopPropagation(); copy(t.contract); }}>
                <span className="font-mono text-sm text-earth-stone opacity-70 group-hover:text-earth-sage">{t.contract.slice(0, 6)}...{t.contract.slice(-4)}</span>
                <div className="p-1 rounded-md text-earth-stone group-hover:text-earth-sage group-hover:bg-earth-cream/50">
                   {copiedText === t.contract ? <Check size={16} /> : <Copy size={16} />}
                </div>
              </div>
            </Tooltip>
          </div>
        </div>
      ),
      className: "px-6 py-4 text-left whitespace-nowrap"
    },
    // 1. Chain (Center)
    {
      content: (
        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-earth-cream/60 text-earth-darkbrown border border-earth-cream">
          {t.chain}
        </span>
      ),
      className: "px-2 py-4 text-center whitespace-nowrap align-middle"
    },
    // 2. M.Cap (Right)
    {
      content: t.marketCap ? <QtyDisplay qty={t.marketCap} prefix="$" /> : <span className="text-earth-stone/50 text-xs">-</span>,
      className: "px-6 py-4 text-right whitespace-nowrap text-earth-stone font-mono"
    },
    // 3. Entry (Right)
    {
      content: <PriceDisplay price={entry} />,
      className: "px-6 py-4 text-right whitespace-nowrap text-earth-darkbrown"
    },
    // 4. Current Price (Right)
    {
      content: (
        <div>
           <div className={`font-mono font-medium ${priceChanges[t.contract] === 'up' ? 'animate-text-pop-green' : priceChanges[t.contract] === 'down' ? 'animate-text-pop-red' : ''}`}>
             <PriceDisplay price={t.currentPrice} />
           </div>
           <div className={`text-sm mt-1 font-normal ${chgColor}`}>{chg > 0 ? '▲' : chg < 0 ? '▼' : ''} {Math.abs(chg).toFixed(2)}%</div>
        </div>
      ),
      className: "px-6 py-4 text-right whitespace-nowrap text-earth-darkbrown"
    },
    // 5. PnL (Right)
    {
      content: (
        <>
          <div className={`flex items-center justify-end gap-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {pnl >= 0 ? '▲' : '▼'}{Math.abs(pnl).toFixed(2)}%
          </div>
          <div className="text-sm mt-1 text-earth-stone font-normal">
            {profitAmount >= 0 ? '+$' : '-$'}<QtyDisplay qty={Math.abs(profitAmount)} />
          </div>
        </>
      ),
      className: "px-6 py-4 text-right whitespace-nowrap font-semibold"
    },
    // 6. Invest (Right)
    {
      content: (
        <>
          <div className="text-earth-darkbrown font-medium">$<QtyDisplay qty={inv} /></div>
          <div className="text-sm text-earth-stone mt-1"><QtyDisplay qty={qty} /></div>
        </>
      ),
      className: "px-6 py-4 text-right whitespace-nowrap"
    },
    // 7. Value (Right)
    {
      content: <span className="font-bold text-earth-darkbrown">$<QtyDisplay qty={value} /></span>,
      className: "px-6 py-4 text-right whitespace-nowrap"
    },
    // 8. Allocation (Right)
    {
      content: (
        <div className="flex flex-col justify-center gap-1">
          <div className="w-full bg-earth-cream/70 rounded-full h-2.5 overflow-hidden border border-earth-cream/30">
             <div className={`h-full rounded-full ${allocation > 30 ? 'bg-earth-olive/90' : 'bg-earth-sage/90'}`} style={{ width: `${Math.max(allocation, 2)}%` }}></div>
          </div>
          <div className="pt-1 w-full text-right text-xs text-earth-stone/95 font-mono">{allocation.toFixed(2)}%</div>
        </div>
      ),
      className: "px-6 py-4 text-right whitespace-nowrap align-middle"
    },
    // 9. Actions (Center) - จุดไข่ปลา
    {
      content: (
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="text-earth-stone hover:text-earth-darkbrown transition">
          <MoreHorizontal />
        </button>
      ),
      className: "px-6 py-4 text-center whitespace-nowrap align-middle"
    }
  ];

  return (
    <tr 
      className="group relative border-b border-earth-cream/60 hover:bg-earth-cream/40 transition-colors duration-200 overflow-hidden w-full"
      onWheel={handleWheel}
    >
      {/* 🟢 Actions Layer (ซ่อนอยู่ข้างหลัง) */}
      <td className="absolute right-0 top-0 bottom-0 p-0 border-none z-0" style={{ width: SLIDE_WIDTH }}>
        <div className="h-full w-full flex items-center justify-center gap-3 bg-earth-cream/10 shadow-inner border-l border-earth-cream/30">
           <a href={`https://dexscreener.com/${t.chain}/${t.contract}`} target="_blank" className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm text-earth-stone hover:text-earth-olive hover:scale-105 transition-all border border-earth-cream/50">
              <LineChart size={16} />
           </a>
           <a href="#" className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm text-earth-stone hover:text-green-600 hover:scale-105 transition-all border border-earth-cream/50">
              <FileSpreadsheet size={16} />
           </a>
           <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm text-earth-stone hover:text-earth-clay hover:scale-105 transition-all border border-earth-cream/50">
              <X size={16} />
           </button>
        </div>
      </td>

      {/* 🟢 Content Layer (ตัวตารางที่เลื่อนได้) */}
      {columns.map((col, idx) => (
        <td 
          key={idx} 
          className={`${col.className} relative z-10 transition-transform duration-300 ease-out bg-white group-hover:bg-earth-cream/5`}
          style={{ 
            transform: isExpanded ? `translateX(-${SLIDE_WIDTH}px)` : 'translateX(0)',
            // ต้องใส่ bg-white เพื่อไม่ให้เห็นปุ่มข้างหลังทะลุออกมาตอนยังไม่เลื่อน
            // แต่ใส่ group-hover เพื่อให้เปลี่ยนสีตอนชี้ได้ (Mac style)
          }}
        >
          {col.content}
        </td>
      ))}
    </tr>
  );
};