'use client';

import React from 'react';
import { Globe, Zap, TrendingUp, DollarSign } from 'lucide-react';

export default function MarketHeader() {
  // Mock Data
  const stats = [
    { label: 'Market Cap', value: '$2.45T', change: '+1.2%', icon: Globe },
    { label: '24h Volume', value: '$84.2B', change: '-5.4%', icon: TrendingUp },
    { label: 'BTC Dominance', value: '54.2%', change: null, icon: DollarSign },
    { label: 'ETH Gas', value: '12 Gwei', change: null, icon: Zap },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white border border-earth-cream/60 rounded-xl p-4 shadow-sm flex items-center gap-3 transition-transform hover:-translate-y-1 duration-300"
        >
          <div className="p-2 bg-earth-cream/40 rounded-lg text-earth-sage">
            <stat.icon size={18} />
          </div>
          <div>
            <p className="text-xs text-earth-stone uppercase font-bold tracking-wider">
              {stat.label}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-earth-darkbrown font-mono">
                {stat.value}
              </span>
              {stat.change && (
                <span
                  className={`text-xs font-bold ${stat.change.startsWith('+')
                      ? 'text-green-600'
                      : 'text-red-500'
                    }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
