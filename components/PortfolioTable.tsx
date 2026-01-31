'use client';
import {
  Search,
  X,
  ChevronDown,
  Copy,
  Check,
  LineChart,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DropdownSelect from '@/components/ui/DropdownSelect';
import { EnrichedToken } from '@/lib/enrichWithPrices';
import { SortButton } from '@/components/ui/SortButton';
import PriceDisplay from '@/components/PriceDisplay';
import QtyDisplay from '@/components/QtyDisplay';
import { useCopyToClipboard } from '@/hook/useCopyToClipboard';
import React from 'react';
import Tooltip from '@/components/ui/Tooltips';
import { SwipeableRow } from './SwipeableRow';
import { getGraphLink, getGoogleSheetLink } from './ui/RowActions';
import MobileFilterDrawer from '@/components/MobileFilterDrawer';
import CoinDrawer from '@/components/CoinDrawer';

type Props = {
  tokens: EnrichedToken[];
  setCopied?: (value: boolean) => void;
  loading?: boolean;
  isFilterOpen: boolean;
  setIsFilterOpen: (isOpen: boolean) => void;
};

function PortfolioTable({
  tokens: initialTokens,
  isFilterOpen,
  setIsFilterOpen,
}: Props) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const { copiedText, copy } = useCopyToClipboard();
  const [selectedToken, setSelectedToken] = useState<EnrichedToken | null>(null);

  useEffect(() => {
    // ใช้สำหรับให้ทั้งตาราง fade-in ตอนเปิดหน้านี้ครั้งแรกเท่านั้น
    setMounted(true);
  }, []);

  // Insert priceChangedKeys and tokens state
  const [priceChanges, setPriceChanges] = useState<
    Record<string, 'up' | 'down'>
  >({});
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // For keeping old prices between refreshes
  const oldPrices = useRef<Record<string, number>>({});
  // For always-latest tokens reference for polling
  const latestTokensRef = useRef<EnrichedToken[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'pnlPercentage',
    direction: 'desc',
  });

  // Mobile accordion state
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>(
    {}
  );
  // Only allow one expanded at a time
  const toggleTokenExpand = (contract: string) => {
    setExpandedTokens((prev) => {
      const newExpanded: Record<string, boolean> = {};
      newExpanded[contract] = !prev[contract]; // toggle current, collapse others
      return newExpanded;
    });
  };

  function requestSort(key: string) {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else {
        setSortConfig(null); // reset sort
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  }

  // Step 1: Initialize tokens state with initialTokens prop (enriched with totalQty, totalInv, totalEntry)
  useEffect(() => {
    if (initialTokens && initialTokens.length > 0) {
      setInitialLoading(true);
      setTokens(initialTokens); // ใช้ข้อมูลตรงๆ
      setInitialLoading(false);
    }
  }, [initialTokens]);

  // Step 2: Update the useEffect that handles oldPrices
  // Only initialize oldPrices once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && tokens.length > 0) {
      tokens.forEach((t) => {
        oldPrices.current[t.contract] = t.currentPrice;
      });
      initialized.current = true;
    }
  }, [tokens]);

  // Keep latest tokens in a ref for polling
  useEffect(() => {
    latestTokensRef.current = tokens;
  }, [tokens]);

  // Refresh Prices Handler
  // ค้นหาฟังก์ชัน handleRefreshPrices เดิม แล้วแทนที่ด้วยอันนี้ครับ
  const handleRefreshPrices = useCallback(async () => {
    try {
      // 1. ⚡ OPTIMIZE: ส่งไปแค่ Chain/Address (ลดขนาด Payload)
      const minimalPayload = latestTokensRef.current.map((t) => ({
        chain: t.chain,
        contract: t.contract,
        address: t.contract,
      }));

      const response = await fetch('/api/refreshPrices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: minimalPayload, // ส่งก้อนเล็กไป
          oldPrices: oldPrices.current,
        }),
      });
      const cleanNumber = (val: any) => {
        if (val === null || val === undefined) return 0;
        // ลบลูกน้ำออกก่อนแปลง
        const num = Number(String(val).replace(/,/g, ''));
        // เช็คเหมือน enrich: ถ้าไม่ใช่ Finite (เป็น NaN หรือ Infinity) ให้คืนค่า 0
        return Number.isFinite(num) ? num : 0;
      };

      // Server จะส่งกลับมาแค่ข้อมูลราคา (ก้อนเล็ก)
      const { updatedTokens: freshPriceData } = await response.json();

      // 2. 🔄 MERGE: เอาราคาใหม่มารวมกับข้อมูลเดิม (Logo/Qty) ที่หน้าบ้าน
      // สร้าง Map ราคาใหม่เพื่อความเร็ว
      const updateMap = new Map<string, any>();
      freshPriceData.forEach((t: any) => {
        const key = t.contract.toLowerCase();
        updateMap.set(key, t); // เก็บ t ทั้งก้อนเลย
      });

      const newChanges: Record<string, 'up' | 'down'> = {};

      const mergedTokens = latestTokensRef.current.map((token) => {
        // 🛡️ ป้องกัน Key ไม่ตรง: trim ช่องว่างทิ้งทั้งคู่
        const key = token.contract.toLowerCase().trim();
        const update = updateMap.get(key);

        // ✅ 1. ถ้าไม่เจอ Update เลย ให้ใช้ค่าเดิม
        if (!update) return token;

        // ดึงค่าใหม่จาก API
        let newPrice = cleanNumber(update.currentPrice);
        let newChange = cleanNumber(update.priceChangeH24);
        let newMarketCap = cleanNumber(update.marketCap);

        if (newPrice <= 0 && token.currentPrice > 0) {
          newPrice = token.currentPrice;

          // ถ้าจะให้เนียน ควรใช้ Change/Mcap เดิมด้วยถ้าของใหม่พัง
          if (newChange === 0) newChange = token.priceChangeH24;
          if (newMarketCap === 0) newMarketCap = token.marketCap;
        }

        const oldPrice = token.currentPrice;
        const diff = newPrice - oldPrice;

        // Logic เช็คการเด้งสี (เหมือนเดิม)
        if (
          Math.abs(diff) > 0.00000001 &&
          (oldPrice === 0 || Math.abs(diff) / oldPrice > 0.000001)
        ) {
          newChanges[token.contract] = diff > 0 ? 'up' : 'down';
        }

        // คืนค่า Token ที่ผสานค่าแล้ว
        return {
          ...token,
          currentPrice: newPrice,
          priceChangeH24: newChange,
          marketCap: newMarketCap,
        };
      });
      // 3. Update State
      setTokens(mergedTokens);
      setPriceChanges(newChanges);

      setTimeout(() => setPriceChanges({}), 3000);

      // Update Refs
      mergedTokens.forEach((t) => {
        oldPrices.current[t.contract] = t.currentPrice;
      });
      latestTokensRef.current = mergedTokens;
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
    }
  }, []);

  // Auto-refresh prices every 1 minutes while the table is mounted
  useEffect(() => {
    if (initialLoading) return;

    const intervalMs = 1 * 60 * 1000; // 1 minute
    const id = setInterval(() => {
      void handleRefreshPrices();
    }, intervalMs);

    return () => clearInterval(id);
  }, [initialLoading, handleRefreshPrices]);

  const [viewMode, setViewMode] = useState<
    'total' | 'high' | 'low' | 'other' | 'free'
  >('total');

  // New filteredTokens useMemo: filter by searchTerm (name/symbol), then filter by viewMode
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        token.name.toLowerCase().includes(term) ||
        (token.symbol ? token.symbol.toLowerCase().includes(term) : false) ||
        token.contract.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (viewMode === 'high') return token.highInv > 0;
      if (viewMode === 'low') return token.lowInv > 0;
      if (viewMode === 'other') return token.otherInv > 0;
      if (viewMode === 'free') return token.freeInv > 0;
      return token.totalInv > 0;
    });
  }, [tokens, viewMode, searchTerm]);

  // คำนวณ value รวมเพื่อหา allocation
  const totalValue = useMemo(() => {
    return tokens.reduce((sum, row) => {
      // เลือก Qty ตามโหมดที่ดูอยู่
      const qty =
        viewMode === 'high'
          ? row.highQty
          : viewMode === 'low'
            ? row.lowQty
            : viewMode === 'other'
              ? row.otherQty
              : viewMode === 'free'
                ? row.freeQty
                : row.totalQty;

      // ถ้าไม่มีจำนวน ไม่ต้องบวก
      if (qty <= 0) return sum;

      return sum + qty * row.currentPrice;
    }, 0);
  }, [tokens, viewMode]);

  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort((a, b) => {
      if (!sortConfig) return 0;
      let aVal: any;
      let bVal: any;
      if (sortConfig.key === 'value') {
        const aQty =
          viewMode === 'high'
            ? a.highQty
            : viewMode === 'low'
              ? a.lowQty
              : viewMode === 'other'
                ? a.otherQty
                : viewMode === 'free'
                  ? a.freeQty
                  : a.totalQty;
        const bQty =
          viewMode === 'high'
            ? b.highQty
            : viewMode === 'low'
              ? b.lowQty
              : viewMode === 'other'
                ? b.otherQty
                : viewMode === 'free'
                  ? b.freeQty
                  : b.totalQty;
        aVal = a.currentPrice * aQty;
        bVal = b.currentPrice * bQty;
      } else if (sortConfig.key === 'allocation') {
        const aQty =
          viewMode === 'high'
            ? a.highQty
            : viewMode === 'low'
              ? a.lowQty
              : viewMode === 'other'
                ? a.otherQty
                : viewMode === 'free'
                  ? a.freeQty
                  : a.totalQty;
        const bQty =
          viewMode === 'high'
            ? b.highQty
            : viewMode === 'low'
              ? b.lowQty
              : viewMode === 'other'
                ? b.otherQty
                : viewMode === 'free'
                  ? b.freeQty
                  : b.totalQty;
        const aValue = a.currentPrice * aQty;
        const bValue = b.currentPrice * bQty;
        aVal = totalValue > 0 ? (aValue / totalValue) * 100 : 0;
        bVal = totalValue > 0 ? (bValue / totalValue) * 100 : 0;
      } else if (sortConfig.key === 'totalInv') {
        aVal =
          viewMode === 'high'
            ? a.highInv
            : viewMode === 'low'
              ? a.lowInv
              : viewMode === 'other'
                ? a.otherInv
                : viewMode === 'free'
                  ? a.freeInv
                  : a.totalInv;
        bVal =
          viewMode === 'high'
            ? b.highInv
            : viewMode === 'low'
              ? b.lowInv
              : viewMode === 'other'
                ? b.otherInv
                : viewMode === 'free'
                  ? b.freeInv
                  : b.totalInv;
      } else if (sortConfig.key === 'pnlPercentage') {
        const aQty =
          viewMode === 'high'
            ? a.highQty
            : viewMode === 'low'
              ? a.lowQty
              : viewMode === 'other'
                ? a.otherQty
                : viewMode === 'free'
                  ? a.freeQty
                  : a.totalQty;
        const bQty =
          viewMode === 'high'
            ? b.highQty
            : viewMode === 'low'
              ? b.lowQty
              : viewMode === 'other'
                ? b.otherQty
                : viewMode === 'free'
                  ? b.freeQty
                  : b.totalQty;
        const aEntry =
          viewMode === 'high'
            ? a.highEntry
            : viewMode === 'low'
              ? a.lowEntry
              : viewMode === 'other'
                ? a.otherEntry
                : viewMode === 'free'
                  ? a.freeEntry
                  : a.totalEntry;
        const bEntry =
          viewMode === 'high'
            ? b.highEntry
            : viewMode === 'low'
              ? b.lowEntry
              : viewMode === 'other'
                ? b.otherEntry
                : viewMode === 'free'
                  ? b.freeEntry
                  : b.totalEntry;
        aVal = aEntry > 0 ? ((a.currentPrice - aEntry) / aEntry) * 100 : 0;
        bVal = bEntry > 0 ? ((b.currentPrice - bEntry) / bEntry) * 100 : 0;
      } else if (sortConfig.key === 'marketCap') {
        // แปลง null/undefined ให้เป็น 0 เพื่อให้ Sort แล้วไปกองข้างล่าง (กรณี Desc)
        aVal = a.marketCap ?? 0;
        bVal = b.marketCap ?? 0;
      }
      // ✅ เพิ่ม Logic: 24h Change (เผื่อใช้)
      else if (sortConfig.key === 'priceChangeH24') {
        aVal = a.priceChangeH24 ?? -999999; // ไม่มีข้อมูลให้ไปล่างสุด
        bVal = b.priceChangeH24 ?? -999999;
      } else {
        aVal = a[sortConfig.key as keyof typeof a];
        bVal = b[sortConfig.key as keyof typeof b];
      }

      // การเปรียบเทียบค่า
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredTokens, sortConfig, viewMode, totalValue]);
  // 1. กำหนดจำนวนเริ่มต้นที่จะแสดง (เริ่มที่ 50)
  const [visibleCount, setVisibleCount] = useState(50);

  // 2. ตัว Ref สำหรับจับว่าเลื่อนถึงล่างสุดหรือยัง
  const mobileTarget = useRef(null);
  const desktopTarget = useRef(null);

  // 3. Reset กลับไป 50 เสมอ เมื่อมีการ Search/Sort/Filter ใหม่
  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, viewMode, sortConfig, tokens]);

  // 4. สร้างตัวแปรใหม่ "visibleTokens" (ตัดมาแสดงแค่เท่าที่กำหนด)
  const visibleTokens = useMemo(() => {
    return sortedTokens.slice(0, visibleCount);
  }, [sortedTokens, visibleCount]);

  // 5. ระบบ Auto Load เมื่อเลื่อนลงล่างสุด
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // ถ้าตัวใดตัวหนึ่งโผล่มา ให้โหลดเพิ่ม
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((prev) => Math.min(prev + 50, sortedTokens.length));
        }
      },
      { threshold: 0.1 }
    );
    if (mobileTarget.current) observer.observe(mobileTarget.current);
    if (desktopTarget.current) observer.observe(desktopTarget.current);

    return () => observer.disconnect();
  }, [sortedTokens]);

  const sortOptions = [
    { key: 'name', label: 'Asset' },
    { key: 'chain', label: 'Chain' },
    { key: 'marketCap', label: 'Market Cap' },
    { key: 'pnlPercentage', label: 'Profit / Loss' },
    { key: 'totalInv', label: 'Invested' },
    { key: 'value', label: 'Value' },
    { key: 'priceChangeH24', label: '24h Change' },
  ];

  return (
    <div
      className="w-full px-0 transition-opacity duration-300"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <div className="w-full overflow-x-auto overflow-y-auto md:overflow-y-visible max-h-[85dvh] md:max-h-none bg-white rounded-xl shadow-xl border border-earth-cream/60 max-w-screen-2xl mx-auto">
        {/* Header Controls */}
        <div className="w-full bg-white p-6 rounded-t-xl sticky top-0 z-[60] shadow-md border-b border-earth-cream/80 md:border-none md:shadow-none md:relative ">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-4">
            {/* Title */}
            <div className="flex justify-between items-center w-full md:w-auto">
              <h2 className="text-2xl  font-bold text-earth-primary tracking-tight">
                All Asset
              </h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-start md:items-center justify-start md:justify-end">
              {/* Search Input */}
              <div className="w-full md:w-auto flex items-center gap-4">
                <div className="relative w-full group">
                  <div className=" absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-stone/80 group-focus-within:text-earth-sage transition-colors">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search tokens or addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 py-2.5 w-full bg-earth-cream/20 border border-earth-cream/60 rounded-xl text-earth-darkbrown placeholder-earth-stone/80 focus:outline-none focus:ring-2 focus:ring-earth-sage/50 focus:border-earth-sage transition-all text-sm font-mono hover:bg-earth-cream/30"
                  />

                  {searchTerm && (
                    // 2. ❌ Wrapper: แค่กำหนดตำแหน่งก็พอ (ตัด flex ออก เพราะ Tooltip จัดการตัวเองได้แล้ว)
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
                      <Tooltip content="Clear" side="bottom">
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="p-1 rounded-full bg-earth-brown/50 text-white hover:bg-red-400 transition-all duration-200 shadow-sm hover:scale-110 flex items-center justify-center text-sm"
                        >
                          <X size={10} strokeWidth={4} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>

              {/* --- MOBILE ONLY: Filter & Sort Button (New Style) --- */}
              <div className="w-full md:hidden mt-0">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="w-full flex items-center justify-center gap-2 p-1 font-bold py-2.5 rounded-xl shadow-sm uppercase transition-all tracking-wide  bg-earth-sage text-white duration-200 hover:bg-earth-olive text-sm"
                >
                  <SlidersHorizontal size={16} />
                  View Mode & Sort Options
                </button>
              </div>

              {/* --- DESKTOP ONLY: View Mode Dropdown --- */}
              <div className="w-full md:w-auto hidden md:block">
                <DropdownSelect
                  options={[
                    {
                      label: 'MAIN',
                      items: ['total', 'high', 'low'],
                    },
                    {
                      label: 'ETC',
                      items: ['other', 'free'],
                    },
                  ]}
                  selected={viewMode}
                  onSelect={(val) => {
                    setViewMode(
                      val as 'total' | 'high' | 'low' | 'other' | 'free'
                    );
                  }}
                  getLabel={(val) => {
                    switch (val) {
                      case 'total':
                        return 'Total';
                      case 'high':
                        return 'High';
                      case 'low':
                        return 'Low';
                      case 'other':
                        return 'Other';
                      case 'free':
                        return 'Free';
                      default:
                        return val.toUpperCase();
                    }
                  }}
                  buttonClass="bg-earth-sage text-white transition-colors duration-200 hover:bg-earth-olive hover:shadow-sm uppercase font-semibold px-4 py-2 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----------- Mobile Stacked/Accordion View (With Show More) ----------- */}
        <div className="md:hidden transition-opacity duration-300 pb-20">
          {initialLoading ? (
            <LoadingIndicator />
          ) : sortedTokens.length === 0 ? (
            <div className="text-center text-earth-stone p-6">No data</div>
          ) : (
            <div className="space-y-4 p-4">
              {visibleTokens.map((t) => {
                // --- 1. Logic คำนวณค่า (เหมือนเดิม) ---
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
                const profitAmount = value - inv;
                const pnlPercentage =
                  entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
                const allocation =
                  totalValue > 0 ? (value / totalValue) * 100 : 0;
                const chg = t.priceChangeH24 ?? 0;
                const chgColor =
                  chg > 0
                    ? 'text-green-600'
                    : chg < 0
                      ? 'text-red-600'
                      : 'text-earth-stone';

                const isProfit = profitAmount >= 0;
                const pnlColor = isProfit ? 'text-green-700' : 'text-red-700';
                const isExpanded = expandedTokens[t.contract];

                return (
                  <div
                    key={t.contract}
                    className="bg-white rounded-xl border border-earth-cream/80 shadow-sm overflow-hidden relative"
                  >
                    {/* --- Header: Identity & Price (แสดงตลอด) --- */}
                    <div
                      className="p-4 pb-2 flex justify-between items-start"
                      onClick={() => toggleTokenExpand(t.contract)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={t.logo || '/smile.png'}
                            onError={(e) => {
                              e.currentTarget.src = '/smile.png';
                            }}
                            alt={t.name}
                            className="w-11 h-11 rounded-full bg-white shadow-sm p-0.5 border border-earth-cream/40 object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-[#Fdfbf7] text-earth-darkbrown text-[9px] font-bold px-1.5 py-0.5 rounded border border-earth-cream/60 shadow-sm uppercase">
                            {t.chain.length > 4
                              ? `${t.chain.slice(0, 3)}..`
                              : t.chain}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-earth-darkbrown text-lg leading-tight truncate max-w-[140px]">
                            {t.name}
                          </div>
                          {/* แสดง Price แทน Value เมื่อปิด Grid */}
                          <div
                            className="flex items-center text-xs text-earth-stone font-mono cursor-pointer group gap-1"
                            onClick={(e) => {
                              e.stopPropagation(); // กันไม่ให้ไปกดโดนการขยาย Accordion
                              copy(t.contract, 'Address');
                            }}
                          >
                            <span className="font-mono transition-colors group-hover:text-earth-sage">
                              {t.contract.slice(0, 6)}...
                            </span>
                            <div className="transition-colors group-hover:text-earth-sage flex items-center relative">
                              <button className="transition-colors">
                                <div className="p-1 rounded-md text-earth-stone group-hover:text-earth-sage group-hover:bg-earth-cream/50 transition-all duration-200">
                                  {/* เช็คว่า index นี้ถูกก๊อปปี้หรือไม่ */}
                                  {copiedText === t.contract ? (
                                    <Check
                                      size={12}
                                      className="text-earth-sage animate-in zoom-in duration-300"
                                    />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {/* 1. Value (มูลค่ารวม) */}
                        <div className="text-earth-darkbrown font-semibold text-lg">
                          $
                          {value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>

                        {/* 1. Percentage Line: มีลูกศร + พื้นหลังสี */}
                        <div
                          className={`flex items-center justify-end gap-1 font-semibold px-2 py-0.5 rounded-md ml-auto w-fit ${isProfit
                            ? 'text-green-700 bg-green-50'
                            : 'text-red-700 bg-red-50'
                            }`}
                        >
                          {isProfit ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                              <polyline points="16 7 22 7 22 13" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <polyline points="2 7 10.5 15.5 15.5 10.5 22 17" />
                              <polyline points="16 17 22 17 22 11" />
                            </svg>
                          )}
                          <span className="text-xs">
                            {pnlPercentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* --- Collapsible Area: Stats Grid (ส่วนที่ซ่อน) --- */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden border-earth-cream/20 ${isExpanded
                        ? 'max-h-[500px] opacity-100 border-t'
                        : 'max-h-0 opacity-0 border-none'
                        }`}
                    >
                      <div className="px-4 py-2 bg-earth-cream/10">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-earth-cream/50 p-3 rounded-xl border border-earth-cream/40">
                          {/* --- Row 1: Entry Price vs Current Price --- */}
                          <div>
                            <div className="text-earth-stone text-[10px] uppercase tracking-wide">
                              Avg. Price
                            </div>
                            <div className="font-medium text-earth-darkbrown">
                              <PriceDisplay price={entry} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div>
                              <div className="text-earth-stone text-[10px] uppercase tracking-wide">
                                Price / 24h
                              </div>
                              <div className="font-medium text-earth-darkbrown">
                                <PriceDisplay price={t.currentPrice} />
                              </div>
                              {/* ส่วนแสดง 24h % Change */}
                              <div
                                className={`text-[10px] font-bold mt-0.5 ${chgColor}`}
                              >
                                {chg > 0 ? '▲' : chg < 0 ? '▼' : ''}{' '}
                                {chg.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          {/* ✅ Separator 1: เพิ่มเส้นแบ่งตรงนี้กลับมาครับ */}
                          <div className="col-span-2 h-px bg-earth-cream/60 my-1"></div>

                          {/* --- Row 2: M.Cap vs Holdings --- */}
                          <div>
                            <div className="text-earth-stone text-[10px] uppercase tracking-wide">
                              M.Cap
                            </div>
                            <div
                              className="font-medium font-mono text-earth-stone transition-all duration-300 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                copy(
                                  t.marketCap.toLocaleString(),
                                  'Market Cap'
                                );
                              }}
                            >
                              {t.marketCap ? (
                                <QtyDisplay qty={t.marketCap} prefix="$" />
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-earth-stone text-[10px] uppercase tracking-wide">
                              Quantity
                            </div>
                            <div
                              className="font-medium text-earth-darkbrown transition-all duration-300 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                copy(qty.toLocaleString(), 'Quantity');
                              }}
                            >
                              <QtyDisplay qty={qty} />
                            </div>
                          </div>

                          {/* ✅ Separator 2: เส้นแบ่งเดิมก่อนเข้าเรื่องเงิน */}
                          <div className="col-span-2 h-px bg-earth-cream/60 my-1"></div>

                          {/* --- Row 3: Invested vs PnL --- */}
                          <div className="col-span-2 flex justify-between items-end">
                            <div>
                              <div className="text-earth-stone text-[10px] uppercase tracking-wide mb-0.5">
                                Invested
                              </div>
                              <div className="text-xl font-semibold text-earth-darkbrown">
                                {inv >= 10_000 ? (
                                  <QtyDisplay qty={inv} prefix="$" />
                                ) : (
                                  <>
                                    $
                                    {inv.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-earth-stone text-[10px] uppercase tracking-wide mb-0.5">
                                Total PnL
                              </div>
                              <div
                                className={`font-semibold ${pnlColor} text-xl`}
                              >
                                {Math.abs(profitAmount) >= 10_000 ? (
                                  <QtyDisplay
                                    qty={Math.abs(profitAmount)}
                                    prefix={isProfit ? '+$' : '-$'}
                                  />
                                ) : (
                                  <>
                                    {isProfit ? '+' : '-'}$
                                    {Math.abs(profitAmount).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- Allocation Bar (แสดงตลอด) --- */}
                    <div
                      className="px-4 py-2"
                      onClick={() => toggleTokenExpand(t.contract)}
                    >
                      <div className="flex justify-between text-[10px] text-earth-stone mb-1 font-medium">
                        <span>Allocation</span>
                        <span>{allocation.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-earth-cream/70 rounded-full h-2.5 overflow-hidden border border-earth-cream/30">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-out ${
                            // เปลี่ยนสีตามความเยอะ (Logic เดียวกับ Desktop)
                            allocation > 30
                              ? 'bg-earth-olive/90'
                              : 'bg-earth-sage/90'
                            }`}
                          style={{
                            // บังคับความกว้างขั้นต่ำ 2% แก้ปัญหาขีดแหว่งๆ
                            width: `${Math.max(allocation, 1)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* --- Footer: Actions & Toggle Button --- */}
                    <div className="px-4 py-2 bg-earth-cream border-t border-earth-cream/40 flex justify-between items-center mt-1">
                      {/* ปุ่ม Show More / Hide */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTokenExpand(t.contract);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-earth-darkbrown transition-colors uppercase tracking-wide"
                      >
                        {isExpanded ? 'Hide Stats' : 'Show Stats'}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      {/* ปุ่ม Link (Chart / Sheet) */}
                      <div className="flex gap-2">
                        {/* ✅ แก้ไข: เปลี่ยนจาก <a> เป็น <button> เพื่อเรียก CoinDrawer */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // กันไม่ให้ไปกวน Accordion
                            setSelectedToken(t); // ✅ สั่งเปิด CoinDrawer โดยส่ง token ตัวนี้เข้าไป
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-earth-cream/60 text-earth-darkbrown text-xs font-semibold shadow-sm active:scale-95 transition-all"
                        >
                          <LineChart size={14} />
                          Chart
                        </button>
                        <a
                          href={getGoogleSheetLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-earth-cream/60 text-earth-darkbrown text-xs font-semibold shadow-sm active:scale-95 transition-all"
                        >
                          <FileSpreadsheet size={14} />
                          Sheet
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {visibleTokens.length < sortedTokens.length && (
                <div
                  ref={mobileTarget}
                  className="text-earth-stone text-base animate-pulse text-center pt-4"
                >
                  Loading more assets...
                </div>
              )}
            </div>
          )}
        </div>
        <MobileFilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortConfig={sortConfig}
          requestSort={requestSort}
          sortOptions={sortOptions}
        />

        {/* ----------- Desktop/Tablet Table View ----------- */}
        <div className="hidden md:block relative z-[0] overflow-y-auto max-h-[85vh] transition-opacity duration-300">
          <table className="w-full border-collapse border-earth-cream/60 text-sm md:text-base">
            <thead className="hidden sm:table-header-group sticky top-0 z-[20] bg-earth-cream/80 backdrop-blur-md">
              <tr>
                {/* 1. Asset (ชิดซ้าย) */}
                <th className="px-6 py-4 w-[260.25px] text-left text-base font-semibold text-earth-brown">
                  <SortButton
                    column="name"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                  // ไม่ต้องใส่ className เพราะ default คือชิดซ้าย
                  >
                    Asset
                  </SortButton>
                </th>

                {/* 2. Chain (กึ่งกลาง) */}
                <th className="px-2 py-4 w-[108.55px] whitespace-nowrap text-sm md:text-base font-semibold text-earth-brown">
                  <SortButton
                    column="chain"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-center w-full" // ✅ ใส่ justify-center ตรงนี้
                  >
                    Chain
                  </SortButton>
                </th>

                {/* 3. Market Cap (ชิดขวา) */}
                <th className="px-6 py-4 w-[130.38px] whitespace-nowrap text-base font-semibold text-earth-brown">
                  <SortButton
                    column="marketCap"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-end w-full" // ✅ ใส่ justify-end ตรงนี้ (ลบ div ออก)
                  >
                    M.Cap
                  </SortButton>
                </th>

                {/* 4. Entry Price (ไม่มี Sort) */}
                <th className="px-6 py-4 w-[152.22px] whitespace-nowrap text-right text-base font-semibold text-earth-brown">
                  Avg. Price
                </th>

                {/* 5. Current Price (ชิดขวา) */}
                <th className="px-6 py-4 w-[152.23px] whitespace-nowrap text-base font-semibold text-earth-brown">
                  <SortButton
                    column="priceChangeH24"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-end w-full"
                  >
                    Price / 24h
                  </SortButton>
                </th>

                {/* 6. PnL % (ชิดขวา) */}
                <th className="px-6 py-4 w-[133.05px] whitespace-nowrap text-base font-semibold text-earth-brown">
                  <SortButton
                    column="pnlPercentage"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-end w-full"
                  >
                    Total Pnl
                  </SortButton>
                </th>

                {/* 7. Invest/Qty (ชิดขวา) */}
                <th className="px-6 py-4 w-[141.34px] whitespace-nowrap text-base font-semibold text-earth-brown">
                  <SortButton
                    column="totalInv"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-end w-full"
                  >
                    Invested
                  </SortButton>
                </th>

                {/* 8. Value (ชิดขวา) */}
                <th className="px-6 py-4 w-[141.23px] whitespace-nowrap text-base font-semibold text-earth-brown">
                  <SortButton
                    column="value"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                    className="justify-end w-full"
                  >
                    Value
                  </SortButton>
                </th>

                {/* 9. Allocation (ไม่มี Sort) */}
                <th className="px-6 py-4 w-[173.88px] whitespace-nowrap text-right text-base font-semibold text-earth-brown">
                  Allocation
                </th>

                {/* 10. Actions */}
                <th className="px-6 py-4 w-[108.92px] whitespace-nowrap text-center text-base font-semibold text-earth-brown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                // 🟡 CASE LOADING: สร้าง Row เดียว ที่กินพื้นที่ 10 คอลัมน์ (colSpan=10)
                <tr>
                  <td colSpan={8} className="py-20 text-center bg-white/50">
                    <div className="flex justify-center items-center">
                      <LoadingIndicator />
                    </div>
                  </td>
                </tr>
              ) : sortedTokens.length === 0 ? (
                // 🔴 CASE NO DATA
                <tr>
                  <td
                    colSpan={12}
                    className="py-20 text-center text-earth-stone text-lg bg-white/50"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                visibleTokens.map((t) => (
                  <SwipeableRow
                    key={t.contract}
                    t={t}
                    viewMode={viewMode}
                    priceChanges={priceChanges}
                    copy={copy}
                    copiedText={copiedText}
                    totalValue={totalValue}
                    isExpanded={openRowId === t.contract}
                    onSelect={(token) => setSelectedToken(token)}
                    onToggle={() =>
                      setOpenRowId((prev) =>
                        prev === t.contract ? null : t.contract
                      )
                    }
                  />
                ))
              )}
            </tbody>
          </table>
          {!initialLoading && visibleTokens.length < sortedTokens.length && (
            <div
              ref={desktopTarget}
              className="w-full h-12 flex justify-center items-center py-4"
            >
              <span className="text-earth-stone text-base animate-pulse">
                Loading more assets...
              </span>
            </div>
          )}
          <CoinDrawer
            isOpen={!!selectedToken}
            onClose={() => setSelectedToken(null)}
            coin={selectedToken}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(PortfolioTable);
