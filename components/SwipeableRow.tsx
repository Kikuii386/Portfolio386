import React from 'react';
import {
  MoreHorizontal,
  LineChart,
  FileSpreadsheet,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { EnrichedToken } from '@/lib/enrichWithPrices';
import PriceDisplay from '@/components/PriceDisplay';
import QtyDisplay from '@/components/QtyDisplay';
import Tooltip from '@/components/ui/Tooltips';
import { getGraphLink, getGoogleSheetLink } from './ui/RowActions';
import { motion } from 'framer-motion';

interface SwipeableRowProps {
  t: EnrichedToken;
  viewMode: string;
  priceChanges: any;
  copy: (text: string, label?: string) => void;
  copiedText: string;
  isExpanded: boolean;
  onToggle: () => void;
  totalValue?: number;
}

export const SwipeableRow = ({
  t,
  viewMode,
  priceChanges,
  copy,
  copiedText,
  isExpanded,
  onToggle,
  totalValue = 0,
}: SwipeableRowProps) => {
  // --- Calculation Logic (เหมือนเดิม) ---
  const entry =
    viewMode === 'high'
      ? t.highEntry
      : viewMode === 'low'
      ? t.lowEntry
      : viewMode === 'other'
      ? t.otherEntry
      : viewMode === 'free'
      ? t.freeEntry
      : t.totalEntry;
  const qty =
    viewMode === 'high'
      ? t.highQty
      : viewMode === 'low'
      ? t.lowQty
      : viewMode === 'other'
      ? t.otherQty
      : viewMode === 'free'
      ? t.freeQty
      : t.totalQty;
  const inv =
    viewMode === 'high'
      ? t.highInv
      : viewMode === 'low'
      ? t.lowInv
      : viewMode === 'other'
      ? t.otherInv
      : viewMode === 'free'
      ? t.freeInv
      : t.totalInv;
  const value = t.currentPrice * qty;
  const pnl = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
  const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
  const profitAmount = value - inv;
  const chg = t.priceChangeH24 ?? 0;
  const chgColor =
    chg > 0 ? 'text-green-700 ' : chg < 0 ? 'text-red-700' : 'text-earth-stone';

  const SLIDE_WIDTH = 160;

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 20 && !isExpanded) onToggle();
      if (e.deltaX < -20 && isExpanded) onToggle();
    }
  };

  // --- Column Config (ใช้ % ให้เต็มจอ 100%) ---
  const columns = [
    // 1. Asset (19%)
    {
      className: 'w-[260.25px] flex-none px-6 py-4 text-left flex-shrink-0',
      content: (
        <div className="flex items-center">
          <img
            src={t.logo || '/smile.png'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/smile.png';
            }}
            alt={t.name}
            loading="lazy"
            className="h-10 w-10 rounded-full border border-earth-cream mr-4 flex-shrink-0"
          />
          {/* ใช้ min-w-0 เพื่อกัน Layout แตก แต่ข้างในใช้สไตล์แบบเก่า */}
          <div className="min-w-0">
            <div className="font-semibold text-earth-darkbrown">{t.name}</div>

            <Tooltip content="Copy address" side="right">
              <div
                className="inline-flex items-center gap-1.5 cursor-pointer group/addr align-middle"
                onClick={(e) => {
                  e.stopPropagation();
                  copy(t.contract, 'Address');
                }}
              >
                {/* 1. Address Text: เพิ่ม hover opacity และ transition แบบเก่า */}
                <span className="font-mono text-sm text-earth-stone opacity-70 group-hover/addr:text-earth-sage group-hover/addr:opacity-100 transition-all duration-200">
                  {t.contract.slice(0, 6)}...{t.contract.slice(-4)}
                </span>

                {/* 2. Icon Wrapper: เพิ่ม bg hover และ padding แบบเก่า */}
                <div className="p-1 rounded-md text-earth-stone group-hover/addr:text-earth-sage group-hover/addr:bg-earth-cream/50 transition-all duration-200">
                  {copiedText === t.contract ? (
                    <Check
                      size={16} // ปรับขนาดเป็น 16
                      className="text-earth-sage animate-in zoom-in duration-200"
                    />
                  ) : (
                    <Copy size={16} /> // ปรับขนาดเป็น 16
                  )}
                </div>
              </div>
            </Tooltip>
          </div>
        </div>
      ),
    },
    // 2. Chain (7%)
    {
      className:
        'w-[108.55px] flex-none px-2 py-4 text-center flex-shrink-0 flex justify-center items-center',
      content: (
        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-earth-cream/60 text-earth-darkbrown border border-earth-cream">
          {t.chain}
        </span>
      ),
    },
    // 3. M.Cap (8%)
    {
      className:
        'w-[130.38px] flex-none px-6 py-4 flex justify-end text-earth-stone font-mono flex-shrink-0 cursor-pointer ',
      content: t.marketCap ? (
        <Tooltip content={`$${t.marketCap.toLocaleString()}`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              copy(t.marketCap.toLocaleString(), 'Market Cap');
            }}
            // ✅ 2. เพิ่ม Effect เวลาเอาเมาส์ชี้/กด (ให้รู้ว่ากดได้)
            className="hover:text-earth-darkbrown/80 transition-all duration-300 active:scale-95 select-none"
          >
            <QtyDisplay qty={t.marketCap} prefix="$" />
          </div>
        </Tooltip>
      ) : (
        <span className="text-earth-stone text-xs">-</span>
      ),
    },
    // 4. Entry Price (9%)
    {
      className:
        'w-[152.22px] flex-none px-6 py-4 text-right text-earth-darkbrown flex-shrink-0',
      content: <PriceDisplay price={entry} />,
    },
    // 5. Current Price (10%)
    {
      className:
        'w-[152.23px] flex-none px-6 py-4 text-right text-earth-darkbrown flex-shrink-0',
      content: (
        <div className="w-full">
          <div
            className={`inline-block transition-all duration-300 origin-right ${
              priceChanges[t.contract] === 'up'
                ? 'animate-text-pop-green'
                : priceChanges[t.contract] === 'down'
                ? 'animate-text-pop-red '
                : ''
            }`}
          >
            <PriceDisplay price={t.currentPrice} />
          </div>
          <div
            className={`w-full text-right text-sm mt-1 font-normal ${chgColor}`}
          >
            {chg > 0 ? '▲' : chg < 0 ? '▼' : ''} {chg.toFixed(2)}%
          </div>
        </div>
      ),
    },
    // 6. PnL (9%)
    {
      className: `w-[133.05px] flex-none px-6 py-4 text-right font-semibold flex-shrink-0 transition-colors duration-300 ${
        pnl >= 0 ? 'text-green-600' : 'text-red-600'
      }`,
      content: (
        <div className="w-full">
          {/* ส่วนเปอร์เซ็นต์ + SVG */}
          <div className="w-full text-right flex items-center justify-end gap-1">
            {pnl >= 0 ? (
              // SVG ลูกศรขึ้น (สีเขียว)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            ) : (
              // SVG ลูกศรลง (สีแดง)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <polyline points="2 7 10.5 15.5 15.5 10.5 22 17" />
                <polyline points="16 17 22 17 22 11" />
              </svg>
            )}
            {/* แสดงตัวเลขทศนิยม 2 ตำแหน่ง */}
            {Math.abs(pnl).toFixed(2)}%
          </div>

          {/* ส่วนตัวเลขกำไร/ขาดทุน (บรรทัดล่าง) */}
          <div className="w-full text-right text-sm mt-1 text-earth-stone font-normal">
            {profitAmount >= 0 ? '+$' : '-$'}
            {Math.abs(profitAmount) >= 10_000 ? (
              <QtyDisplay qty={Math.abs(profitAmount)} />
            ) : (
              Math.abs(profitAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </div>
        </div>
      ),
    },
    // 7. Invest (9%)
    {
      className:
        'w-[141.34px] flex-none px-6 py-4 text-right text-earth-darkbrown flex-shrink-0',
      content: (
        <div className="w-full flex flex-col items-end">
          <div className="w-full text-right">
            $
            {inv >= 100_000 ? (
              <QtyDisplay qty={inv} />
            ) : (
              inv.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </div>
          <Tooltip content={`${qty.toFixed(2)}`}>
            <div
              className="w-full flex-none text-sm text-earth-stone mt-1 cursor-pointer hover:text-earth-darkbrown/80 transition-all duration-300 active:scale-95 select-none"
              onClick={(e) => {
                e.stopPropagation();
                copy(qty.toString(), 'Quantity');
              }}
            >
              <QtyDisplay qty={qty} />
            </div>
          </Tooltip>
        </div>
      ),
    },
    // 8. Value (9%)

    {
      className:
        'w-[141.23px] flex-none px-6 py-4 flex justify-end text-earth-darkbrown flex-shrink-0 font-semibold',
      content: (
        <Tooltip
          content={`$${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}`}
        >
          <div className="w-full text-right">
            $
            {value >= 100_000 ? (
              <QtyDisplay qty={value} />
            ) : (
              value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </div>
        </Tooltip>
      ),
    },

    // 9. Allocation (13%)
    {
      className:
        'w-[173.88px] flex-none px-6 py-4 text-right flex-shrink-0 flex flex-col justify-center',
      content: (
        <div className="w-full flex flex-col justify-center gap-1">
          <div className="w-full bg-earth-cream/70 rounded-full h-2.5 overflow-hidden border border-earth-cream/30">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                allocation > 30 ? 'bg-earth-olive/90' : 'bg-earth-sage/90'
              }`}
              style={{ width: `${Math.max(allocation, 1)}%` }}
            ></div>
          </div>
          <div className="pt-1 w-full text-right text-xs text-earth-stone/95 font-mono">
            {allocation.toFixed(2)}%
          </div>
        </div>
      ),
    },
    // 10. Actions (7%)
    {
      className:
        'w-[108.92px] flex-none px-6 py-4 text-center flex-shrink-0 flex items-center justify-end md:justify-center',
      content: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-earth-stone hover:text-earth-darkbrown transition"
        >
          <MoreHorizontal size={18} />
        </button>
      ),
    },
  ];

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      
      // 5. ปรับความเร็ว (Spring จะดูเด้งดึ๋งและสมูทกว่า Linear)
      transition={{ 
        layout: { type: "spring", stiffness: 45, damping: 10 }, // สำหรับการย้ายที่
        opacity: { duration: 0.2 } // สำหรับการจางเข้า/ออก
      }}

      className="group hover:bg-earth-cream/40 transition-colors duration-300"
      onWheel={handleWheel}
    >
      <td colSpan={10} className="p-0 border-none">
        <div className="relative w-full overflow-hidden">
          {/* 🟢 LAYER 1: Actions (Background) */}
          <div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center gap-2 bg-earth-cream/20 shadow-inner border-l border-earth-cream/40 z-0"
            style={{ width: SLIDE_WIDTH }}
          >
            <Tooltip content="Chart">
              <a
                href={getGraphLink(t)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-earth-stone hover:text-earth-olive border border-earth-cream/60 transition-transform hover:scale-110"
              >
                <LineChart size={16} />
              </a>
            </Tooltip>
            <Tooltip content="Sheet">
              <a
                href={getGoogleSheetLink()}
                target="_blank"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-earth-stone hover:text-green-600 border border-earth-cream/60 transition-transform hover:scale-110"
              >
                <FileSpreadsheet size={16} />
              </a>
            </Tooltip>
            <Tooltip content="Close">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-earth-stone hover:text-earth-clay border border-earth-cream/60 transition-transform hover:scale-110"
              >
                <X size={16} />
              </button>
            </Tooltip>
          </div>

          {/* 🟢 LAYER 2: Content (Foreground) */}
          {/* ✅ เปลี่ยนเป็น w-full เพื่อให้ยืดเต็มจอ */}
          <div
            className="flex items-center w-full bg-white group-hover:bg-[#FAF9F6] transition-all duration-500 ease-in-out relative z-10"
            style={{
              transform: isExpanded
                ? `translateX(-${SLIDE_WIDTH}px)`
                : 'translateX(0)',
            }}
          >
            {columns.map((col, idx) => (
              <div key={idx} className={col.className}>
                {col.content}
              </div>
            ))}
          </div>
        </div>
      </td>
    </motion.tr>
  );
};
