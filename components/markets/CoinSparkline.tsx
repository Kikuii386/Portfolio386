'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface CoinSparklineProps {
  data: number[];
  priceChange: number; // ใช้กำหนดสี (บวก=เขียว, ลบ=แดง)
}

export default function CoinSparkline({
  data,
  priceChange,
}: CoinSparklineProps) {
  const isPositive = priceChange >= 0;
  const chartData = data.map((val, i) => ({ i, val }));
  const color = isPositive ? '#606c38' : '#bc4749'; // Earth Green / Earth Red

  return (
    <div className="w-[100px] h-[35px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* ซ่อนแกน Y เพื่อความ Clean แต่ใส่ domain ให้กราฟไม่แบนติดพื้น */}
          <YAxis domain={['dataMin', 'dataMax']} hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
