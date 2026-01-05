'use client';
import {
  Search,
  X,
  ChevronDown,
  Copy,
  Check,
  MoreHorizontal,
  LineChart,
  FileSpreadsheet,
  ExternalLink,
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

type Props = {
  tokens: EnrichedToken[];
  setCopied?: (value: boolean) => void;
  loading?: boolean;
};

const RowActions = ({ token }: { token: any }) => {
  const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID';
  const graphUrl = `https://dexscreener.com/${token.chain.toLowerCase()}/${
    token.contract
  }`;

  return (
    <div className="flex justify-end relative z-10">
      {/* Container หลัก: ปกติจะกว้างแค่พอดีปุ่ม More แต่พอ Hover จะยืดออก */}
      <div className="group flex items-center bg-transparent hover:bg-white/90 hover:shadow-lg hover:ring-1 hover:ring-earth-cream/50 p-1 rounded-full transition-all duration-300 ease-out w-8 hover:w-auto overflow-hidden">
        {/* 1. ปุ่มหลัก (More Icon) - อยู่ขวาสุดเสมอ */}
        <div className="flex-shrink-0 cursor-pointer text-earth-stone group-hover:text-earth-darkbrown p-0.5">
          <MoreHorizontal size={16} />
        </div>

        {/* 2. ปุ่มที่ซ่อนอยู่ (จะ Slide ออกมาทางซ้าย) */}
        <div className="flex items-center gap-1 w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300 pl-0 group-hover:pl-2 border-l border-earth-cream/0 group-hover:border-earth-cream/40 ml-0 group-hover:ml-2">
          {/* ปุ่ม Graph */}
          <Tooltip content="View Graph">
            <a
              href={graphUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-full text-earth-stone hover:text-earth-olive hover:bg-earth-cream/50 transition-colors"
            >
              <LineChart size={14} />
            </a>
          </Tooltip>

          {/* ปุ่ม Google Sheet */}
          <Tooltip content="Open Sheet">
            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-full text-earth-stone hover:text-green-600 hover:bg-earth-cream/50 transition-colors"
            >
              <FileSpreadsheet size={14} />
            </a>
          </Tooltip>

          {/* ปุ่ม Scan (แถมให้) */}
          <Tooltip content="Explorer">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // ใส่ Logic เปิด explorer ที่เราเขียนไว้ก่อนหน้านี้
                window.open(
                  `https://etherscan.io/address/${token.contract}`,
                  '_blank'
                );
              }}
              className="p-1.5 rounded-full text-earth-stone hover:text-blue-500 hover:bg-earth-cream/50 transition-colors"
            >
              <ExternalLink size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

function PortfolioTable({ tokens: initialTokens }: Props) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const { copiedText, copy } = useCopyToClipboard();

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
      // ไม่ต้องคำนวณเอง ให้ใช้ค่าจาก Google Sheet ที่ API ส่งมา
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

  // --- 📊 DASHBOARD CALCULATION ---
  const dashboardStats = useMemo(() => {
    let totalBal = 0;
    let totalInv = 0;
    let bestAsset = { symbol: '-', pnl: -Infinity };
    let worstAsset = { symbol: '-', pnl: Infinity };

    tokens.forEach((t) => {
      // คำนวณ Value ตาม Logic เดียวกับตาราง
      const qty = t.totalQty; // ใช้ Total เป็นหลักสำหรับ Dashboard
      const val = t.currentPrice * qty;
      const inv = t.totalInv;

      totalBal += val;
      totalInv += inv;

      // หาตัวท็อป/บ๊วย (คำนวณจาก PnL%)
      const entry = t.totalEntry;
      const pnlPct = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;

      if (pnlPct > bestAsset.pnl && val > 10) {
        // กรองเศษเหรียญออก (val > 10)
        bestAsset = { symbol: t.symbol || t.name, pnl: pnlPct };
      }
      if (pnlPct < worstAsset.pnl && val > 10) {
        worstAsset = { symbol: t.symbol || t.name, pnl: pnlPct };
      }
    });

    const totalPnLVal = totalBal - totalInv;
    const totalPnLPct = totalInv > 0 ? (totalPnLVal / totalInv) * 100 : 0;

    return { totalBal, totalPnLVal, totalPnLPct, bestAsset };
  }, [tokens]);

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

  // Sort options with labels for dropdown
  const sortOptions = [
    { key: 'name', label: 'Asset' },
    { key: 'chain', label: 'Chain' },
    { key: 'pnlPercentage', label: 'PnL' },
    { key: 'totalInv', label: 'Invest' },
    { key: 'value', label: 'Value' },
  ];

  return (
    <div
      className="w-full px-0 transition-opacity duration-300"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <div className="w-full overflow-x-auto overflow-y-auto md:overflow-y-visible max-h-[85vh] md:max-h-none bg-white rounded-xl shadow-xl border border-earth-cream/60 max-w-screen-2xl mx-auto">
        {/* Header Controls */}
        <div className="w-full bg-white p-6 rounded-t-xl sticky top-0 z-30 md:relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-earth-primary">All Asset</h2>
            <div className="flex flex-col md:flex-row gap-4 w-full sm:w-auto items-start md:items-center justify-start md:justify-end">
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
                          type="button" // ✅ ใส่กันเหนียวไว้ ไม่ให้ไป Trigger การ Submit form
                          onClick={() => setSearchTerm('')}
                          // ✅ เพิ่ม flex justify-center items-center เพื่อให้ตัว X อยู่กลางวงกลมเป๊ะๆ
                          className="p-1 rounded-full bg-earth-brown/50 text-white hover:bg-red-400 transition-all duration-200 shadow-sm hover:scale-110 flex items-center justify-center"
                        >
                          <X size={10} strokeWidth={4} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
              {/* Responsive Sort + View Mode controls */}
              <div className="w-full flex gap-2 md:hidden mb-2">
                {/* Sort Button (mobile only) */}
                <div className="w-1/2">
                  <DropdownSelect
                    options={[
                      {
                        label: 'SORT BY',
                        items: sortOptions.map((o) => o.key),
                      },
                    ]}
                    selected={sortConfig?.key || ''}
                    onSelect={(val) => requestSort(val)}
                    buttonClass="bg-earth-cream text-earth-brown transition-colors duration-200 uppercase"
                    getLabel={(key) =>
                      sortOptions.find((o) => o.key === key)?.label || key
                    }
                  />
                </div>
                {/* ViewMode Button (mobile) */}
                <div className="w-1/2">
                  <DropdownSelect
                    options={[
                      {
                        label: 'MAIN', // หัวข้อกลุ่มที่ 1
                        items: ['total', 'high', 'low'],
                      },
                      {
                        label: 'ETC', // หัวข้อกลุ่มที่ 2
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
                    buttonClass="bg-earth-sage text-white transition-colors duration-200 hover:bg-earth-olive uppercase"
                  />
                </div>
              </div>

              {/* View Mode Dropdown - Desktop/Tablet only (always show, not hidden) */}
              <div className="w-full md:w-auto hidden md:block ">
                <DropdownSelect
                  // 1. แก้ไขตรงนี้: เปลี่ยน options ให้เป็นรูปแบบกลุ่ม
                  options={[
                    {
                      label: 'MAIN', // หัวข้อกลุ่มที่ 1
                      items: ['total', 'high', 'low'],
                    },
                    {
                      label: 'ETC', // หัวข้อกลุ่มที่ 2
                      items: ['other', 'free'],
                    },
                  ]}
                  selected={viewMode}
                  onSelect={(val) => {
                    setViewMode(
                      val as 'total' | 'high' | 'low' | 'other' | 'free'
                    );
                  }}
                  // 2. แนะนำให้เพิ่ม getLabel เพื่อให้ชื่อสวยงาม (ถ้าต้องการ)
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
                  buttonClass="bg-earth-sage text-white transition-colors duration-200 hover:bg-earth-olive hover:shadow-sm uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----------- Mobile Stacked/Accordion View ----------- */}
        <div className="md:hidden transition-opacity duration-300">
          {initialLoading ? (
            <LoadingIndicator />
          ) : sortedTokens.length === 0 ? (
            <div className="text-center text-earth-stone p-6">No data</div>
          ) : (
            <div className="space-y-2 p-4 ">
              {visibleTokens.map((t, index) => {
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
                const pnl =
                  entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
                const allocation =
                  totalValue > 0 ? (value / totalValue) * 100 : 0;
                const isExpanded = expandedTokens[t.contract];
                const profitAmount = value - inv;
                return (
                  <div
                    key={t.contract}
                    className="bg-white rounded-lg border border-earth-cream/60 p-4 shadow-sm"
                  >
                    {/* Top row: logo, name, contract, PnL% + value */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <img
                          src={t.logo || '/smile.png'}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/smile.png';
                          }}
                          alt={t.name}
                          loading="lazy"
                          className="h-10 w-10 rounded-full border border-earth-cream mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-earth-darkbrown truncate">
                            {t.name}
                          </div>
                          <div
                            className="flex items-center text-xs text-earth-stone font-mono cursor-pointer group gap-1"
                            onClick={(e) => {
                              e.stopPropagation(); // กันไม่ให้ไปกดโดนการขยาย Accordion
                              copy(t.contract, 'Address');
                            }}
                          >
                            <span className="font-mono transition-colors group-hover:text-earth-sage">
                              {t.contract.slice(0, 6)}...{t.contract.slice(-4)}
                            </span>
                            <div className="transition-colors group-hover:text-earth-sage flex items-center relative">
                              <button className="transition-colors">
                                <div className="p-1 rounded-md text-earth-stone group-hover:text-earth-sage group-hover:bg-earth-cream/50 transition-all duration-200">
                                  {/* เช็คว่า index นี้ถูกก๊อปปี้หรือไม่ */}
                                  {copiedText === t.contract ? (
                                    <Check
                                      size={12}
                                      className="text-earth-sage animate-in zoom-in duration-200"
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
                      <div className="text-right ml-3">
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {pnl >= 0 ? (
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
                          {pnl.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          %
                        </div>
                        <div className="text-sm text-earth-darkbrown">
                          <QtyDisplay
                            prefix={profitAmount >= 0 ? '+$' : '-$'}
                            qty={Math.abs(profitAmount)}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Data blocks: Price, Holdings, Allocation */}
                    <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                      <div className="bg-earth-cream/60 rounded-lg p-2">
                        <div className="text-xs text-earth-stone font-medium">
                          Price
                        </div>
                        <div className=" text-earth-darkbrown text-sm">
                          {t.currentPrice > 0 ? (
                            <PriceDisplay price={t.currentPrice} />
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </div>
                      <div className="bg-earth-cream/60 rounded-lg p-2">
                        <div className="text-xs text-earth-stone font-medium">
                          Holdings
                        </div>
                        <div className="text-earth-darkbrown text-sm">
                          <QtyDisplay qty={qty} />
                        </div>
                      </div>
                      <div className="bg-earth-cream/60 rounded-lg p-2">
                        <div className="text-xs text-earth-stone font-medium">
                          Chain
                        </div>
                        <div className="font-semibold text-earth-darkbrown text-sm">
                          {t.chain}
                        </div>
                      </div>
                    </div>
                    {/* Allocation bar */}
                    <div className="mb-3">
                      <div className="flex flex-col justify-center gap-1">
                        {/* 1. หลอดพลัง (Bar) */}
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
                        <div className="pt-1 w-full text-right text-xs text-earth-stone/95 font-mono">
                          {allocation.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    {/* Footer: Show More, buttons */}
                    <div className="flex justify-between items-center text-sm text-earth-sage font-semibold">
                      <button
                        className="flex items-center gap-1"
                        onClick={() => toggleTokenExpand(t.contract)}
                      >
                        {isExpanded ? 'Hide' : 'Show More'}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {/* Expanded section with animated transition */}
                    <div
                      className={`transition-[max-height,opacity,margin] duration-300 ease-in-out overflow-hidden border-earth-cream/30 space-y-2 ${
                        isExpanded
                          ? // 1. ลด max-h เหลือ 200px (เพราะเนื้อหามีนิดเดียว) จะทำให้จังหวะการยืดสมูทขึ้น
                            // 2. border-t ย้ายมาใส่ตลอดเวลา (แต่ซ่อนด้วย max-h) หรือใส่ logic แยก
                            'max-h-[200px] opacity-100 mt-3 pt-2 border-t'
                          : 'max-h-0 opacity-0 mt-0 pt-0 border-none'
                      }`}
                    >
                      {/* Flex row for Entry Price and Investment (Chain and Contract removed) */}
                      <div className="flex flex-wrap gap-3 mb-3 text-left">
                        {/* Entry Price */}
                        <div className="bg-earth-sageleaf/30 rounded-lg p-3 flex-1 min-w-0">
                          <div className="text-sm text-earth-tan font-medium">
                            Entry Price
                          </div>
                          <div className="text-earth-darkbrown text-sm">
                            <PriceDisplay price={entry} />
                          </div>
                        </div>
                        {/* Investment */}
                        <div className="bg-earth-mist/60 rounded-lg p-3 flex-1 min-w-0">
                          <div className="text-sm text-earth-tan font-medium">
                            Investment
                          </div>
                          <div className="text-earth-darkbrown text-sm">
                            $
                            {inv >= 10_000 ? (
                              <QtyDisplay qty={inv} />
                            ) : (
                              inv.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleTokens.length < sortedTokens.length && (
                <div
                  ref={mobileTarget}
                  className="text-earth-stone text-base animate-pulse"
                >
                  Loading more assets...
                </div>
              )}
            </div>
          )}
        </div>

        {/* ----------- Desktop/Tablet Table View ----------- */}
        <div className="hidden md:block relative z-0 overflow-y-auto max-h-[85vh] transition-opacity duration-300">
          <table className="table-fixed w-full border-collapse border-earth-cream/60 text-sm md:text-base">
            <thead className="hidden sm:table-header-group sticky top-0 z-20 bg-earth-cream/80 backdrop-blur-md ">
              <tr>
                <th className="px-6 py-4 w-[240px] text-left text-base font-semibold text-earth-brown  cursor-pointer">
                  <SortButton
                    column="name"
                    sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                    onSort={requestSort}
                  >
                    Asset
                  </SortButton>
                </th>
                <th className="px-2 py-4 w-[100px] whitespace-nowrap text-sm md:text-base font-semibold text-earth-brown cursor-pointer">
                  <div className="flex justify-center">
                    <SortButton
                      column="chain"
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      Chain
                    </SortButton>
                  </div>
                </th>
                {/* ✅ NEW: Market Cap Column */}
                <th className="px-6 py-4 w-[120px] whitespace-nowrap text-right text-base font-semibold text-earth-brown cursor-pointer">
                  <div className="flex justify-end">
                    <SortButton
                      column="marketCap"
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      M.Cap
                    </SortButton>
                  </div>
                </th>
                <th className="px-6 py-4 w-[140px] whitespace-nowrap text-right text-base font-semibold text-earth-brown ">
                  Entry Price
                </th>
                <th className="px-6 py-4 w-[140px] whitespace-nowrap text-right text-base font-semibold text-earth-brown cursor-pointer">
                  <div className="flex justify-end">
                    <SortButton
                      column="priceChangeH24" // ✅ ใส่ key ให้ตรงกับที่เขียน Logic ไว้
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      Current Price
                    </SortButton>
                  </div>
                </th>
                <th className="px-6 py-4 w-[120px] whitespace-nowrap text-base font-semibold text-earth-brown  cursor-pointer">
                  <div className="flex justify-end">
                    <SortButton
                      column="pnlPercentage"
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      PnL %
                    </SortButton>
                  </div>
                </th>
                <th className="px-6 py-4 w-[130px] whitespace-nowrap text-base font-semibold text-earth-brown n cursor-pointer">
                  <div className="flex justify-end">
                    <SortButton
                      column="totalInv"
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      Invest/Qty
                    </SortButton>
                  </div>
                </th>
                <th className="px-6 py-4 w-[130px] whitespace-nowrap text-base font-semibold text-earth-brown  cursor-pointer">
                  <div className="flex justify-end">
                    <SortButton
                      column="value"
                      sortConfig={sortConfig ?? { key: '', direction: 'asc' }}
                      onSort={requestSort}
                    >
                      Value
                    </SortButton>
                  </div>
                </th>
                <th className="px-6 py-4 w-[160px] whitespace-nowrap text-right text-base font-semibold text-earth-brown ">
                  Allocation
                </th>
                <th className="px-6 py-4 w-[100px] whitespace-nowrap text-center text-base font-semibold text-earth-brown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                <tr>
                  <td colSpan={10}>
                    <LoadingIndicator />
                  </td>
                </tr>
              ) : visibleTokens.length === 0 ? (
                <tr className="text-center text-earth-stone">
                  <td colSpan={10} className="px-6 py-4 text-sm md:text-base">
                    No data
                  </td>
                </tr>
              ) : (
                visibleTokens.map((t, index) => {
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
                  const pnl =
                    entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
                  const allocation =
                    totalValue > 0 ? (value / totalValue) * 100 : 0;
                  const profitAmount = value - inv;
                  const chg = t.priceChangeH24 ?? 0;
                  const chgColor =
                    chg > 0
                      ? 'text-earth-olive'
                      : chg < 0
                      ? 'text-red-500'
                      : 'text-earth-stone';

                  return (
                    <tr
                      key={t.contract}
                      className="text-center hover:bg-earth-cream/40 cursor-pointer transition-colors duration-300"
                    >
                      {/* Asset */}
                      <td className="px-6 py-4 w-[240px] whitespace-nowrap text-left text-sm md:text-base text-earth-darkbrown">
                        <div className="flex items-center">
                          <img
                            src={t.logo || '/smile.png'}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/smile.png';
                            }}
                            alt={t.name}
                            loading="lazy"
                            className="h-10 w-10 rounded-full border border-earth-cream mr-4"
                          />
                          <div>
                            <div className="font-semibold text-earth-darkbrown">
                              {t.name}
                            </div>
                            <Tooltip content="Copy address" side="right">
                              <div
                                className="inline-flex items-center gap-1.5 cursor-pointer group align-middle"
                                onClick={(e) => {
                                  e.stopPropagation(); // กันไม่ให้ไปกดโดนการขยาย Accordion
                                  copy(t.contract, 'Address');
                                }}
                                title="Click to copy address"
                              >
                                <span className="font-mono text-sm text-earth-stone opacity-70 group-hover:text-earth-sage group-hover:opacity-100 transition-all duration-200">
                                  {t.contract.slice(0, 6)}...
                                  {t.contract.slice(-4)}
                                </span>

                                <div className="p-1 rounded-md text-earth-stone group-hover:text-earth-sage group-hover:bg-earth-cream/50 transition-all duration-200">
                                  {/* เช็คว่า index นี้ถูกก๊อปปี้หรือไม่ */}
                                  {copiedText === t.contract ? (
                                    <Check
                                      size={16}
                                      className="text-earth-sage animate-in zoom-in duration-200"
                                    />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        </div>
                      </td>
                      {/* Chain */}
                      <td className="px-2 py-4 w-[100px] whitespace-nowrap text-center align-middle">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-earth-cream/60 text-earth-darkbrown border border-earth-cream">
                          {t.chain}
                        </span>
                      </td>
                      {/* ✅ NEW: Market Cap */}
                      <td className="px-6 py-4 w-[120px] whitespace-nowrap text-right text-sm md:text-base text-earth-stone font-mono">
                        {t.marketCap ? (
                          <QtyDisplay qty={t.marketCap} prefix="$" />
                        ) : (
                          <span className="text-earth-stone/50 text-xs">-</span>
                        )}
                      </td>
                      {/* Entry Price */}
                      <td className="px-6 py-4 w-[140px] whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
                        <PriceDisplay price={entry} />
                      </td>
                      {/* Current Price */}
                      <td className="px-6 py-4 w-[140px] whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
                        {/* div ครอบเพื่อทำ Text Animation */}
                        <div
                          className={`inline-block transition-all duration-300 origin-right ${
                            priceChanges[t.contract] === 'up'
                              ? 'animate-text-pop-green' // ใส่ font-bold เพิ่มให้เด่นขึ้นตอนเด้ง
                              : priceChanges[t.contract] === 'down'
                              ? 'animate-text-pop-red '
                              : ''
                          }`}
                        >
                          <PriceDisplay price={t.currentPrice} />
                        </div>
                        {/* ✅ 24h Change Display */}
                        <div
                          className={`w-full text-right text-sm mt-1 font-normal ${chgColor}`}
                        >
                          {chg > 0 ? '▲' : chg < 0 ? '▼' : ''} {chg.toFixed(2)}%
                        </div>
                      </td>
                      {/* PnL % */}
                      <td
                        className={`px-6 py-4 w-[120px] whitespace-nowrap text-right text-sm md:text-base font-semibold ${
                          pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        } profit transition duration-300`}
                      >
                        <div className="w-full text-right flex items-center justify-end gap-1">
                          {pnl >= 0 ? (
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
                          {pnl.toFixed(2)}%
                        </div>
                        <div className="w-full text-right text-sm mt-1 text-earth-stone font-normal">
                          {profitAmount >= 0 ? '+$' : '-$'}
                          {Math.abs(profitAmount) >= 10_000 ? (
                            <QtyDisplay qty={Math.abs(profitAmount)} />
                          ) : (
                            // กรณีปกติ: แสดงทศนิยม 2 ตำแหน่ง
                            Math.abs(profitAmount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          )}
                        </div>
                      </td>
                      {/* Investment */}
                      <td className="px-6 py-4 w-[130px] whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
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
                        <div className="w-full text-right text-sm text-earth-stone mt-1">
                          <QtyDisplay qty={qty} />
                        </div>
                      </td>
                      {/* Value */}
                      <td className="px-6 py-4 w-[130px] whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown value transition duration-300">
                        $
                        {value >= 1_000_000 ? (
                          // กรณีมากกว่า 1 ล้าน: ใช้ QtyDisplay ช่วยย่อ (จะได้ 1.5M)
                          <QtyDisplay qty={value} />
                        ) : (
                          // กรณีต่ำกว่า 1 ล้าน: แสดงตัวเลขเต็มๆ (จะได้ 500,000.00)
                          value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        )}
                      </td>
                      {/* Allocation */}
                      <td className="px-6 py-4 w-[160px] whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown align-middle">
                        <div className="flex flex-col justify-center gap-1">
                          <div className="w-full bg-earth-cream/70 rounded-full h-2.5 overflow-hidden border border-earth-cream/30">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ease-out ${
                                // เปลี่ยนสีตามความเยอะ (Option เสริม: ถ้าชอบสีเดียวลบส่วนนี้ได้เลย)
                                allocation > 30
                                  ? 'bg-earth-olive/90'
                                  : 'bg-earth-sage/90'
                              }`}
                              style={{
                                // 2. ใช้ Math.max ให้มันมีเนื้ออย่างน้อย 2% จะได้ไม่ดูเป็นขีดเส้นเดียว
                                width: `${Math.max(allocation, 2)}%`,
                              }}
                            ></div>
                          </div>

                          {/* 3. ตัวเลข (Text) - อยู่ด้านล่างเหมือนเดิม */}
                          <div className="pt-1 w-full text-right text-xs  text-earth-stone/95 font-mono">
                            {allocation.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 w-[80px] whitespace-nowrap text-right align-middle">
                        {/* ส่ง token เข้าไปใน Component */}
                        <RowActions token={t} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {visibleTokens.length < sortedTokens.length && (
            <div
              ref={desktopTarget}
              className="w-full h-12 flex justify-center items-center py-4"
            >
              <span className="text-earth-stone text-base animate-pulse">
                Loading more assets...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(PortfolioTable);
