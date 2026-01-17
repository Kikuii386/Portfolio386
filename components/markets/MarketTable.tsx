'use client';

import React from 'react';
import { Star } from 'lucide-react';
import CoinSparkline from './CoinSparkline';

export default function MarketTable() {
  // Mock Data สำหรับ 5 เหรียญ
  const coins = [
    {
      rank: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      price: 64230,
      h1: 0.1,
      h24: 2.5,
      d7: 5.2,
      mcap: 1200000000000,
      vol: 35000000000,
      sparkline: [60000, 61000, 60500, 62000, 63000, 62500, 64230],
    },
    {
      rank: 2,
      name: 'Ethereum',
      symbol: 'ETH',
      price: 3450,
      h1: -0.2,
      h24: 1.8,
      d7: 3.1,
      mcap: 400000000000,
      vol: 15000000000,
      sparkline: [3200, 3300, 3250, 3400, 3420, 3380, 3450],
    },
    {
      rank: 3,
      name: 'Solana',
      symbol: 'SOL',
      price: 145,
      h1: 0.5,
      h24: 8.5,
      d7: 12.4,
      mcap: 65000000000,
      vol: 4000000000,
      sparkline: [120, 125, 130, 128, 135, 140, 145],
    },
    {
      rank: 4,
      name: 'BNB',
      symbol: 'BNB',
      price: 590,
      h1: 0.0,
      h24: -0.5,
      d7: -1.2,
      mcap: 87000000000,
      vol: 1200000000,
      sparkline: [600, 595, 598, 592, 590, 588, 590],
    },
    {
      rank: 5,
      name: 'XRP',
      symbol: 'XRP',
      price: 0.62,
      h1: -0.1,
      h24: 0.2,
      d7: 1.5,
      mcap: 34000000000,
      vol: 800000000,
      sparkline: [0.6, 0.61, 0.605, 0.61, 0.615, 0.618, 0.62],
    },
  ];

  return (
    <div className="bg-white border border-[#F5F2EB] rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F2EB]/50 text-xs text-[#A4AC86] font-bold uppercase tracking-wider border-b border-[#F5F2EB]">
              <th className="p-4 w-10"></th> {/* Star Icon */}
              <th className="p-4">#</th>
              <th className="p-4">Coin</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right hidden sm:table-cell">1h</th>
              <th className="p-4 text-right hidden sm:table-cell">24h</th>
              <th className="p-4 text-right hidden md:table-cell">7d</th>
              <th className="p-4 text-right hidden lg:table-cell">
                Market Cap
              </th>
              <th className="p-4 text-right hidden xl:table-cell">
                Last 7 Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F2EB]">
            {coins.map((coin) => (
              <tr
                key={coin.rank}
                className="hover:bg-[#F5F2EB]/30 transition-colors group"
              >
                <td className="p-4">
                  <Star
                    size={16}
                    className="text-[#C7BFB1] cursor-pointer hover:text-yellow-400 hover:fill-yellow-400 transition-colors"
                  />
                </td>
                <td className="p-4 text-xs font-mono text-[#C7BFB1]">
                  {coin.rank}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {/* Logo Placeholder */}
                      {coin.symbol[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#4A4A48]">
                        {coin.name}
                      </div>
                      <div className="text-xs text-[#C7BFB1]">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right font-mono text-sm font-medium text-[#4A4A48]">
                  ${coin.price.toLocaleString()}
                </td>
                <td
                  className={`p-4 text-right font-mono text-sm hidden sm:table-cell ${coin.h1 >= 0 ? 'text-[#606c38]' : 'text-[#bc4749]'}`}
                >
                  {coin.h1}%
                </td>
                <td
                  className={`p-4 text-right font-mono text-sm hidden sm:table-cell ${coin.h24 >= 0 ? 'text-[#606c38]' : 'text-[#bc4749]'}`}
                >
                  {coin.h24}%
                </td>
                <td
                  className={`p-4 text-right font-mono text-sm hidden md:table-cell ${coin.d7 >= 0 ? 'text-[#606c38]' : 'text-[#bc4749]'}`}
                >
                  {coin.d7}%
                </td>
                <td className="p-4 text-right font-mono text-sm text-[#4A4A48] hidden lg:table-cell">
                  ${(coin.mcap / 1e9).toFixed(2)}B
                </td>
                <td className="p-4 hidden xl:block">
                  <div className="flex justify-end">
                    <CoinSparkline
                      data={coin.sparkline}
                      priceChange={coin.d7}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
