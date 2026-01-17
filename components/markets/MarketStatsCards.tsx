'use client';

import React from 'react';
import { Flame, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

export default function MarketStatsCards() {
  // Mock Data
  const trending = [
    { id: 1, symbol: 'SOL', name: 'Solana', price: 145.2, change: 5.4 },
    { id: 2, symbol: 'PEPE', name: 'Pepe', price: 0.000012, change: 12.1 },
    { id: 3, symbol: 'ONDO', name: 'Ondo', price: 0.98, change: -2.3 },
  ];

  const gainers = [
    { id: 1, symbol: 'WIF', name: 'dogwifhat', price: 3.2, change: 25.4 },
    { id: 2, symbol: 'FET', name: 'Fetch.ai', price: 2.1, change: 18.2 },
    { id: 3, symbol: 'AR', name: 'Arweave', price: 42.5, change: 15.1 },
  ];

  const losers = [
    { id: 1, symbol: 'STRK', name: 'Starknet', price: 1.2, change: -12.4 },
    { id: 2, symbol: 'DYM', name: 'Dymension', price: 3.5, change: -8.2 },
    { id: 3, symbol: 'TIA', name: 'Celestia', price: 11.2, change: -6.5 },
  ];

  const Card = ({ title, icon: Icon, data, type }: any) => (
    <div className="bg-white border border-earth-cream/60 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-earth-darkbrown font-bold flex items-center gap-2">
          <Icon
            size={18}
            className={
              type === 'hot'
                ? 'text-orange-500'
                : type === 'up'
                  ? 'text-green-600'
                  : 'text-red-500'
            }
          />
          {title}
        </h3>
        <button className="text-xs text-earth-sage hover:text-earth-olive flex items-center">
          More <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {data.map((coin: any, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-earth-stone font-mono w-4">
                {i + 1}
              </span>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-500">
                {/* Placeholder Logo */}
                {coin.symbol[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-earth-darkbrown group-hover:text-earth-sage transition-colors">
                  {coin.name}
                </span>
                <span className="text-[10px] text-earth-stone">
                  {coin.symbol}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-earth-darkbrown">
                ${coin.price.toLocaleString()}
              </div>
              <div
                className={`text-[10px] font-bold ${coin.change >= 0 ? 'text-green-600' : 'text-red-500'}`}
              >
                {coin.change >= 0 ? '+' : ''}
                {coin.change}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card title="Trending" icon={Flame} data={trending} type="hot" />
      <Card title="Top Gainers" icon={TrendingUp} data={gainers} type="up" />
      <Card title="Top Losers" icon={TrendingDown} data={losers} type="down" />
    </div>
  );
}
