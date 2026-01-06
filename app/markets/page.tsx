'use client'; // 👈 จำเป็นต้องใส่ เพราะมีการใช้ User Interaction (Swipe)

import React from 'react';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

// ข้อมูลจำลอง (Mock Data)
const mockMarkets = [
  { id: 1, symbol: 'BTC/USDT', price: '68,450.00', change: '+2.4%', vol: '1.2B' },
  { id: 2, symbol: 'ETH/USDT', price: '3,240.50', change: '-1.1%', vol: '800M' },
  { id: 3, symbol: 'SOL/USDT', price: '145.20', change: '+5.7%', vol: '450M' },
  { id: 4, symbol: 'BNB/USDT', price: '580.10', change: '0.0%', vol: '120M' },
];

export default function UmarketsPage() {
  // --- Config Layout (Grid) ---
  // แบ่งเป็น 4 คอลัมน์: ชื่อเหรียญ(กว้างสุด) | ราคา | เปลี่ยนแปลง | ปริมาณ
  const gridLayout = "grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 items-center";

  // --- Action ฝั่งขวา (Delete/Archive) ---
  const trailingActions = (id) => (
    <TrailingActions>
      <SwipeAction
        destructive={true} // ลากยาวแล้วลบเลย
        onClick={() => console.log('Delete item:', id)}
      >
        <div className="flex items-center justify-center bg-red-500 text-white w-full h-full px-4 font-medium tracking-wide">
          DELETE
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <div className="w-full min-h-screen bg-[#Fdfbf7] p-6"> {/* พื้นหลัง Earth Tone อ่อน */}
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#5E4B3C] mb-6">Market Watch</h1>

        {/* --- HEADER (หัวตาราง) --- */}
        <div className={`${gridLayout} px-4 py-3 mb-2 bg-[#5E4B3C] text-[#F5F5F5] rounded-lg shadow-sm text-sm uppercase tracking-wider`}>
          <div>Pair</div>
          <div className="text-right">Price</div>
          <div className="text-right">24h %</div>
          <div className="text-right">Vol</div>
        </div>

        {/* --- BODY (รายการ) --- */}
        <div className="flex flex-col gap-2">
          <SwipeableList fullSwipe={true}>
            {mockMarkets.map((market) => (
              <SwipeableListItem
                key={market.id}
                trailingActions={trailingActions(market.id)}
                className="w-full" // บังคับให้เต็มความกว้าง
              >
                {/* Row Item (Div ที่ทำหน้าที่แทน tr) */}
                <div className={`${gridLayout} w-full bg-white p-4 rounded-md border border-[#8B7355]/20 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
                  
                  {/* Column 1: Pair */}
                  <div className="font-bold text-[#5E4B3C]">{market.symbol}</div>
                  
                  {/* Column 2: Price */}
                  <div className="text-right font-mono text-gray-700">{market.price}</div>
                  
                  {/* Column 3: Change */}
                  <div className={`text-right font-medium ${market.change.includes('+') ? 'text-green-600' : 'text-red-500'}`}>
                    {market.change}
                  </div>

                  {/* Column 4: Volume */}
                  <div className="text-right text-xs text-gray-400">{market.vol}</div>

                </div>
              </SwipeableListItem>
            ))}
          </SwipeableList>
        </div>

        {/* Empty State / Loading Placeholder */}
        {mockMarkets.length === 0 && (
           <div className="p-8 text-center text-[#8B7355] italic">
             No markets data available...
           </div>
        )}
      </div>
    </div>
  );
}