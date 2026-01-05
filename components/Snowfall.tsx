'use client';

import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';

export default function Snowfall() {
  const { isChristmas } = useTheme();
  const [snowflakes, setSnowflakes] = useState<number[]>([]);

  useEffect(() => {
    // สร้างหิมะ 50 ก้อน
    setSnowflakes(Array.from({ length: 70 }, (_, i) => i));
  }, []);

  if (!isChristmas) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
      aria-hidden="true"
    >
      {snowflakes.map((i) => {
        // สุ่มตำแหน่งและความเร็ว
        const left = Math.random() * 100;
        const animationDuration = 10 + Math.random() * 20; // 10-30 วินาที
        const animationDelay = Math.random() * 10;
        const opacity = 0.6 + Math.random() * 0.7;
        const size = 10 + Math.random() * 15;

        return (
          <Snowflake
            key={i}
            className="absolute top-[-20px] rounded-full text-white animate-fall shadow-sm"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animation: `fall ${animationDuration}s linear infinite`,
              animationDelay: `-${animationDelay}s`, // เริ่มตกทันทีแบบสุ่ม
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))',
            }}
          />
        );
      })}
    </div>
  );
}
