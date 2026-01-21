'use client'; // 👈 จำเป็นต้องใส่ เพราะมีการใช้ User Interaction (Swipe)

import React from 'react';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from 'react-swipeable-list';
import MarketDashboard from '@/components/MarketDashboard';

export default function MarketPage() {
  return (
    <section className="py-12" id="dashboard">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">
              Markets
            </h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Cryptocurrency Prices by Market Cap
            </p>
          </div>
        </div>
        <MarketDashboard />

      </div>
    </section>

  );
}
