"use client";
import { useState, useEffect, useRef } from "react";
import { EnrichedToken } from "@/lib/enrichWithPrices";

type Props = {
  tokens: EnrichedToken[];
};

export default function PortfolioTable({ tokens }: Props) {
  const [type, setType] = useState<'total' | 'high' | 'low'>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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

  return (
    <section className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 items-center">
        <h2 className="text-xl font-bold mb-2 md:mb-0 text-earth-darkbrown">Your Portfolio</h2>
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          {/* Dropdown */}
          <div
            className="relative inline-block text-left"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="bg-earth-sage hover:bg-earth-moss text-white px-4 py-2 rounded-md transition text-sm flex items-center justify-between w-[100px] shadow font-semibold"
            >
              <span className="w-full text-center font-semibold">{type.toUpperCase()}</span>
              <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                {['total', 'high', 'low'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setType(option as any);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left ${type === option ? 'bg-earth-sage text-white' : ''}`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="Search assets..."
          className="border border-earth-cream bg-white rounded px-2 py-1 text-earth-darkbrown focus:outline-none focus:border-earth-sage transition text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-earth-cream/60 text-sm bg-white rounded-xl shadow">
          <thead className="bg-earth-cream/50 backdrop-blur">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-earth-stone uppercase tracking-wider">Asset</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-earth-stone uppercase tracking-wider">Chain</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">Price</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">PnL</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">Invest/QTY</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">Value</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">Allocation</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-earth-stone uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="hover:bg-earth-cream/20 transition">
                <td colSpan={8} className="text-center py-8 text-earth-stone">No data</td>
              </tr>
            ) : (
              filtered.map((t, index) => {
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
                    <td className="px-4 py-2 text-left text-earth-darkbrown">
                      <div className="flex items-center">
                        <img src={t.logo || 'https://via.placeholder.com/32'} alt={t.name} className="h-8 w-8 rounded-full border border-earth-cream mr-3" />
                        <div>
                          <div className="font-semibold text-earth-darkbrown">{t.name}</div>
                          <div className="flex items-center text-xs text-earth-stone">
                            <span>{t.contract.slice(0, 6)}...{t.contract.slice(-4)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-earth-stone">{t.chain}</td>
                    <td className="px-4 py-2 text-right text-earth-darkbrown">${t.currentPrice.toFixed(6)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnl.toFixed(2)}%
                      <div className="text-xs mt-1 text-earth-stone font-normal">
                        {profitAmount >= 0 ? '+' : ''}${profitAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-earth-darkbrown">
                      ${inv.toFixed(2)}
                      <div className="text-xs text-earth-stone mt-1">{qty.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-2 text-right text-earth-darkbrown">${value.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-earth-darkbrown">
                      <div className="w-full bg-earth-cream/70 rounded-full h-2.5">
                        <div className="bg-earth-sage h-2.5 rounded-full transition-all duration-300" style={{ width: `${allocation.toFixed(0)}%` }}></div>
                      </div>
                      <div className="text-xs mt-1 text-earth-stone">{allocation.toFixed(0)}%</div>
                    </td>
                    <td className="px-4 py-2 text-right">
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
    </section>
  );
}