"use client";
import { Search, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { EnrichedToken } from "@/lib/enrichWithPrices";
import { refreshPrices } from "@/lib/refreshPrices";
import { SortButton } from "@/components/ui/SortButton";

type Props = {
  tokens: EnrichedToken[];
  loading?: boolean;
  setCopied?: (value: boolean) => void;
};

export default function PortfolioTable({ tokens, loading, setCopied }: Props) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [type, setType] = useState<'total' | 'high' | 'low'>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // For keeping old prices between refreshes
  const oldPrices = useRef<Record<string, number>>({});

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Mobile accordion state
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});
  const toggleTokenExpand = (contract: string) => {
    setExpandedTokens(prev => ({
      ...prev,
      [contract]: !prev[contract]
    }));
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

  function copyToClipboard(text: string, index: number) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        console.log("Copied:", text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1000);
        if (setCopied) setCopied(true);
      });
    } else {
      console.warn("Clipboard API not available");
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1000);
      if (setCopied) setCopied(true);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Save old prices when tokens change
  useEffect(() => {
    if (tokens.length > 0) {
      tokens.forEach((t) => {
        oldPrices.current[t.contract] = t.currentPrice;
      });
    }
  }, [tokens]);

  // Auto-refresh prices every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPrices(tokens, oldPrices.current);
    }, 10000); // ทุก 10 วินาที
    return () => clearInterval(interval);
  }, [tokens]);

  const filtered = tokens.filter((row) => {
    const match = !searchTerm ||
      (row.name && row.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.contract && row.contract.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!match) return false;
    if (type === 'high') return row.highInv > 0;
    if (type === 'low') return row.lowInv > 0;
    return row.totalInv > 0;
  });

  // คำนวณ value รวมเพื่อหา allocation
  const totalValue = filtered.reduce((sum, row) => {
    const qty = type === 'high' ? row.highQty : type === 'low' ? row.lowQty : row.totalQty;
    return sum + qty * row.currentPrice;
  }, 0);

  // Rename type and setType to viewMode and setViewMode for UI
  const [viewMode, setViewMode] = useState(type);
  // Sync viewMode and type states
  useEffect(() => {
    setType(viewMode);
  }, [viewMode]);

  const sortedTokens = [...filtered].sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal: any;
    let bVal: any;
    if (sortConfig.key === 'value') {
      const aQty = type === 'high' ? a.highQty : type === 'low' ? a.lowQty : a.totalQty;
      const bQty = type === 'high' ? b.highQty : type === 'low' ? b.lowQty : b.totalQty;
      aVal = a.currentPrice * aQty;
      bVal = b.currentPrice * bQty;
    } else if (sortConfig.key === 'allocation') {
      const aQty = type === 'high' ? a.highQty : type === 'low' ? a.lowQty : a.totalQty;
      const bQty = type === 'high' ? b.highQty : type === 'low' ? b.lowQty : b.totalQty;
      const aValue = a.currentPrice * aQty;
      const bValue = b.currentPrice * bQty;
      aVal = totalValue > 0 ? (aValue / totalValue) * 100 : 0;
      bVal = totalValue > 0 ? (bValue / totalValue) * 100 : 0;
    } else if (sortConfig.key === 'totalInv') {
      aVal = type === 'high' ? a.highInv : type === 'low' ? a.lowInv : a.totalInv;
      bVal = type === 'high' ? b.highInv : type === 'low' ? b.lowInv : b.totalInv;
    } else if (sortConfig.key === 'pnlPercentage') {
      const aQty = type === 'high' ? a.highQty : type === 'low' ? a.lowQty : a.totalQty;
      const bQty = type === 'high' ? b.highQty : type === 'low' ? b.lowQty : b.totalQty;
      const aEntry = type === 'high' ? a.highEntry : type === 'low' ? a.lowEntry : a.totalEntry;
      const bEntry = type === 'high' ? b.highEntry : type === 'low' ? b.lowEntry : b.totalEntry;
      aVal = aEntry > 0 ? ((a.currentPrice - aEntry) / aEntry) * 100 : 0;
      bVal = bEntry > 0 ? ((b.currentPrice - bEntry) / bEntry) * 100 : 0;
    } else {
      aVal = a[sortConfig.key as keyof typeof a];
      bVal = b[sortConfig.key as keyof typeof b];
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortConfig.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="px-0 w-full max-w-none">
      <div className="w-full overflow-x-auto bg-white rounded-xl shadow border border-earth-cream/60 max-w-screen-2xl mx-auto">
        {/* Header Controls */}
        <div className="w-full bg-gradient-to-r from-earth-darkbrown to-earth-brown p-6 rounded-t-xl relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-earth-cream">Portfolio Overview</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-sage w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tokens or addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-earth-cream/10 border border-earth-sage/30 rounded-lg text-earth-cream placeholder-earth-sage/70 focus:outline-none focus:ring-2 focus:ring-earth-sage focus:border-transparent w-full sm:w-64"
                />
              </div>
              {/* Toggle + SortBy (Mobile only) */}
              <div className="flex gap-2 md:hidden">
                {/* Toggle TOTAL/HIGH/LOW */}
                <div className="relative inline-block text-left" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex justify-center min-w-[128px] rounded-md border border-earth-sage shadow-sm px-4 py-2 bg-earth-cream text-sm font-medium text-earth-moss hover:bg-earth-sage focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-moss"
                  >
                    {viewMode.toUpperCase()}
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5 text-earth-moss" aria-hidden="true" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-md bg-earth-cream shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {['total', 'high', 'low'].map((option) => (
                          <button
                            key={option}
                            onClick={e => {
                              e.stopPropagation();
                              setViewMode(option as any);
                              setDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              viewMode === option
                                ? 'bg-earth-moss text-earth-cream font-bold'
                                : 'text-earth-moss hover:bg-earth-sage hover:text-earth-cream'
                            }`}
                          >
                            {option.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Sort By Dropdown (Mobile only) */}
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen(prev => !prev)}
                    className="inline-flex justify-center min-w-[128px] rounded-md border border-earth-sage shadow-sm px-4 py-2 bg-earth-cream text-sm font-medium text-earth-moss hover:bg-earth-sage focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-moss"
                  >
                    Sort By: {sortConfig?.key ? sortConfig.key.charAt(0).toUpperCase() + sortConfig.key.slice(1) : 'Asset'}
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5 text-earth-moss" aria-hidden="true" />
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-md bg-earth-cream shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
<div className="py-1">
  {[
    { key: 'name', label: 'Asset' },
    { key: 'chain', label: 'Chain' },
    { key: 'entry', label: 'Entry Price' },
    { key: 'currentPrice', label: 'Current Price' },
    { key: 'pnlPercentage', label: 'PnL %' },
    { key: 'totalInv', label: 'Investment' },
    { key: 'value', label: 'Value' },
    { key: 'allocation', label: 'Allocation' },
  ].map((col) => (
    <button
      key={col.key}
      onClick={() => {
        requestSort(col.key);
        setSortDropdownOpen(false);
      }}
      className={`block w-full text-left px-4 py-2 text-sm ${
        sortConfig?.key === col.key
          ? 'bg-earth-moss text-earth-cream font-bold'
          : 'text-earth-moss hover:bg-earth-sage hover:text-earth-cream'
      }`}
    >
      {col.label}
    </button>
  ))}
</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Toggle (Desktop) */}
              <div className="hidden md:inline-block relative text-left" ref={dropdownRef}>
                {/* ปุ่ม Toggle เดิม (ใช้ร่วมกัน) */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex justify-center min-w-[128px] rounded-md border border-earth-sage shadow-sm px-4 py-2 bg-earth-cream text-sm font-medium text-earth-moss hover:bg-earth-sage focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-moss"
                >
                  {viewMode.toUpperCase()}
                  <ChevronDown className="ml-2 -mr-1 h-5 w-5 text-earth-moss" aria-hidden="true" />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-md bg-earth-cream shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {['total', 'high', 'low'].map((option) => (
                        <button
                          key={option}
                          onClick={e => {
                            e.stopPropagation();
                            setViewMode(option as any);
                            setDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            viewMode === option
                              ? 'bg-earth-moss text-earth-cream font-bold'
                              : 'text-earth-moss hover:bg-earth-sage hover:text-earth-cream'
                          }`}
                        >
                          {option.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ----------- Mobile Stacked/Accordion View ----------- */}
        <div className="md:hidden">
          {loading ? (
            <div className="text-center text-earth-stone p-6">Loading...</div>
          ) : sortedTokens.length === 0 ? (
            <div className="text-center text-earth-stone p-6">No data</div>
          ) : (
            <div className="space-y-2 p-4">
              {sortedTokens.map((t, index) => {
                const entry = type === 'high' ? t.highEntry : type === 'low' ? t.lowEntry : t.totalEntry;
                const qty = type === 'high' ? t.highQty : type === 'low' ? t.lowQty : t.totalQty;
                const inv = type === 'high' ? t.highInv : type === 'low' ? t.lowInv : t.totalInv;
                const value = t.currentPrice * qty;
                const pnl = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
                const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const profitAmount = value - inv;
                const isExpanded = expandedTokens[t.contract];

                return (
                  <div
                    key={t.contract}
                    className="bg-white rounded-lg border border-earth-cream/60 p-4 shadow-sm"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleTokenExpand(t.contract)}
                    >
                      <div className="flex items-center">
                        <img
                          src={t.logo || 'https://via.placeholder.com/40'}
                          alt={t.name}
                          className="h-10 w-10 rounded-full border border-earth-cream mr-3"
                        />
                        <div>
                          <div className="font-semibold text-earth-darkbrown">{t.name}</div>
                          <div className="flex items-center text-sm text-earth-stone">
                            {t.contract.slice(0, 4)}...{t.contract.slice(-4)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(t.contract, index);
                              }}
                              className="ml-1 text-earth-moss hover:text-earth-sage"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className={`text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-semibold">{pnl.toFixed(2)}%</div>
                        <div className="text-sm">${value.toFixed(2)}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-earth-cream/30 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-earth-stone">Chain:</div>
                          <div className="text-right text-earth-darkbrown">{t.chain}</div>

                          <div className="text-earth-stone">Entry Price:</div>
                          <div className="text-right text-earth-darkbrown">${entry.toFixed(6)}</div>

                          <div className="text-earth-stone">Current Price:</div>
                          <div className="text-right text-earth-darkbrown">${t.currentPrice.toFixed(6)}</div>

                          <div className="text-earth-stone">PnL %:</div>
                          <div className={`text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl.toFixed(2)}%
                            <div className="text-xs text-earth-stone">
                              {profitAmount >= 0 ? '+' : ''}${profitAmount.toFixed(2)}
                            </div>
                          </div>

                          <div className="text-earth-stone">Investment:</div>
                          <div className="text-right text-earth-darkbrown">
                            ${inv.toFixed(2)}
                            <div className="text-xs text-earth-stone">{qty.toLocaleString()} tokens</div>
                          </div>

                          <div className="text-earth-stone">Value:</div>
                          <div className="text-right text-earth-darkbrown">
                            ${value.toFixed(2)}
                          </div>

                          <div className="text-earth-stone">Allocation:</div>
                          <div className="text-right">
                            <div className="w-full bg-earth-cream/70 rounded-full h-2 mt-1">
                              <div
                                className="bg-earth-sage h-2 rounded-full"
                                style={{ width: `${allocation.toFixed(0)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-earth-stone mt-1">{allocation.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button className="text-earth-stone hover:text-earth-darkbrown transition">⟳</button>
                          <button className="text-earth-stone hover:text-earth-darkbrown transition">⋯</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ----------- Desktop/Tablet Table View ----------- */}
        <div className="hidden md:block relative z-0 overflow-y-auto max-h-screen">
          <table className="table-fixed w-full border-collapse border-earth-cream/60 text-sm md:text-base">
            <thead className="hidden sm:table-header-group sticky top-0 z-20 bg-earth-cream/60 backdrop-blur-sm">
              <tr>
                <th style={{ width: "220px" }} className="px-6 py-4 text-left text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="name" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Asset
                  </SortButton>
                </th>
                <th style={{ width: "120px" }} className="px-6 py-4 whitespace-nowrap text-center text-sm md:text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="chain" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Chain
                  </SortButton>
                </th>
                <th style={{ width: "140px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown">
                  Entry Price
                </th>
                <th style={{ width: "160px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="currentPrice" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Current Price
                  </SortButton>
                </th>
                <th style={{ width: "120px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="pnlPercentage" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    PnL %
                  </SortButton>
                </th>
                <th style={{ width: "140px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="totalInv" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Investment
                  </SortButton>
                </th>
                <th style={{ width: "140px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="value" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Value
                  </SortButton>
                </th>
                <th style={{ width: "160px" }} className="px-6 py-4 text-right text-base font-semibold text-earth-darkbrown cursor-pointer">
                  <SortButton column="allocation" sortConfig={sortConfig ?? { key: '', direction: 'asc' }} onSort={requestSort}>
                    Allocation
                  </SortButton>
                </th>
                <th style={{ width: "80px" }} className="px-6 py-4 text-center text-base font-semibold text-earth-darkbrown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="text-center text-earth-stone">
                  <td colSpan={9} className="px-6 py-4 text-sm md:text-base">Loading...</td>
                </tr>
              ) : sortedTokens.length === 0 ? (
                <tr className="text-center text-earth-stone">
                  <td colSpan={9} className="px-6 py-4 text-sm md:text-base">No data</td>
                </tr>
              ) : (
                sortedTokens.map((t, index) => {
                  const entry = type === 'high' ? t.highEntry : type === 'low' ? t.lowEntry : t.totalEntry;
                  const qty = type === 'high' ? t.highQty : type === 'low' ? t.lowQty : t.totalQty;
                  const inv = type === 'high' ? t.highInv : type === 'low' ? t.lowInv : t.totalInv;
                  const value = t.currentPrice * qty;
                  const pnl = entry > 0 ? ((t.currentPrice - entry) / entry) * 100 : 0;
                  const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  const profitAmount = value - inv;

                  return (
                    <tr
                      key={t.contract}
                      className="text-center hover:bg-earth-cream/30 cursor-pointer transition"
                    >
                      {/* Asset */}
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm md:text-base text-earth-darkbrown">
                        <div className="flex items-center">
                          <img src={t.logo || 'https://via.placeholder.com/40'} alt={t.name} className="h-10 w-10 rounded-full border border-earth-cream mr-4" />
                          <div>
                            <div className="font-semibold text-earth-darkbrown">{t.name}</div>
                            <div className="flex items-center text-sm text-earth-stone cursor-pointer group gap-1">
                              <span className="transition-colors group-hover:text-earth-sage">{t.contract.slice(0, 6)}...{t.contract.slice(-4)}</span>
                              <div className="transition-colors group-hover:text-earth-sage flex items-center relative">
                                <button
                                  onClick={() => copyToClipboard(t.contract, index)}
                                  className="transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Chain */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm md:text-base text-earth-stone">
                        {t.chain}
                      </td>
                      {/* Entry Price */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
                        ${entry.toFixed(6)}
                      </td>
                      {/* Current Price */}
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown price transition duration-300`}>
                        ${t.currentPrice.toFixed(6)}
                      </td>
                      {/* PnL % */}
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm md:text-base font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'} profit transition duration-300`}>
                        <div className="w-full text-right">{pnl.toFixed(2)}%</div>
                        <div className="w-full text-right text-sm mt-1 text-earth-stone font-normal">
                          {profitAmount >= 0 ? '+' : ''}${profitAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      </td>
                      {/* Investment */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
                        <div className="w-full text-right">${inv.toFixed(2)}</div>
                        <div className="w-full text-right text-sm text-earth-stone mt-1">{qty.toLocaleString()}</div>
                      </td>
                      {/* Value */}
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown value transition duration-300`}>
                        ${value.toFixed(2)}
                      </td>
                      {/* Allocation */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base text-earth-darkbrown">
                        <div className="w-full bg-earth-cream/70 rounded-full h-2.5">
                          <div className="bg-earth-sage h-2.5 rounded-full transition-all duration-300" style={{ width: `${allocation.toFixed(0)}%` }}></div>
                        </div>
                        <div className="w-full text-right text-sm mt-1 text-earth-stone">{allocation.toFixed(0)}%</div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base">
                        <button className="text-earth-stone hover:text-earth-darkbrown transition mr-2">⟳</button>
                        <button className="text-earth-stone hover:text-earth-darkbrown transition">⋯</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


          </div>
        </div>
  );
}