'use client';

import React, { useState } from 'react';
import { Layers, Zap, Globe } from 'lucide-react';
import EvmMultiWalletBalanceChecker from './EvmMultiWalletBalanceChecker';
import SolMultiWalletBalanceChecker from './SolMultiWalletBalanceChecker';
import EtcMultiWalletBalanceChecker from './EtcMultiWalletBalanceChecker';

type GroupKey = 'evm' | 'sol' | 'etc';

export default function CryptoBalanceChecker() {
  const [activeGroup, setActiveGroup] = useState<GroupKey>('evm');

  const TABS = [
    { id: 'evm', label: 'EVM', icon: Layers },
    { id: 'sol', label: 'Solana', icon: Zap },
    { id: 'etc', label: 'Other', icon: Globe },
  ] as const;

  const renderActiveGroup = () => {
    switch (activeGroup) {
      case 'evm':
        return <EvmMultiWalletBalanceChecker />;
      case 'sol':
        return <SolMultiWalletBalanceChecker />;
      case 'etc':
        return <EtcMultiWalletBalanceChecker />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 font-sans ">
      {/* Main Card Container */}
      <div className="bg-white rounded-2xl border border-earth-cream/60 shadow-xl overflow-hidden">
        {/* Tabs Navigation */}
        {/* ใช้ flex-row เสมอ เพื่อให้เรียงแนวนอนทั้ง Mobile และ Desktop */}
        <div className="flex flex-row bg-earth-cream/40 border-b border-earth-cream/40">
          {TABS.map((tab) => {
            const isActive = activeGroup === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveGroup(tab.id as GroupKey)}
                className={`
                  relative flex-1 flex flex-col sm:flex-row items-center justify-center 
                  gap-1.5 sm:gap-2.5 py-4 sm:py-5 px-2
                  transition-all duration-300 outline-none
                  text-xs sm:text-sm font-semibold tracking-wide uppercase
                  border-r border-earth-cream/30 last:border-0
                  ${
                    isActive
                      ? 'text-earth-brown bg-earth-creamlight/20 shadow-inner'
                      : 'text-earth-stone/80 hover:text-earth-brown hover:bg-earth-cream/30'
                  }
                `}
              >
                {/* Icon Size: มือถือ 16px, จอใหญ่ 18px */}
                <Icon
                  className={`transition-colors duration-500 w-4 h-4 sm:w-[18px] sm:h-[18px] ${
                    isActive ? 'text-earth-sage' : 'text-earth-stone/50'
                  }`}
                />

                {/* Label: ตัดคำถ้าจอมือถือเล็กมาก */}
                <span className="whitespace-nowrap">{tab.label}</span>

                {/* Active Indicator (Bottom Line) */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-earth-sage sm:rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8 bg-white min-h-[300px]">
          {renderActiveGroup()}
        </div>
      </div>
    </div>
  );
}
