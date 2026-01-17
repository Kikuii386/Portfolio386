'use client'; // 👈 จำเป็นต้องใส่ เพราะมีการใช้ User Interaction (Swipe)

import React from 'react';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from 'react-swipeable-list';
import MarketHeader from '@/components/markets/MarketHeader';
import MarketStatsCards from '@/components/markets/MarketStatsCards';
import MarketTable from '@/components/markets/MarketTable';

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB]/20 p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* 1. Header: ภาพรวมตลาด */}
      <MarketHeader />

      {/* 2. Highlight: การ์ด Top 3 */}
      <MarketStatsCards />

      {/* 3. Main Table: ตารางราคา */}
      <div>
        <h2 className="text-[#4A4A48] font-bold text-xl mb-4 flex items-center gap-2">
          Cryptocurrency Prices by Market Cap
        </h2>
        <MarketTable />
      </div>
    </div>
  );
}
