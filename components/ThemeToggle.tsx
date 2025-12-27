// components/ThemeToggle.tsx
'use client';

import { useTheme } from '@/context/ThemeContext';
import { Snowflake, Leaf, Earth } from 'lucide-react';

export default function ThemeToggle() {
  const { isChristmas, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ease-in-out
        ${isChristmas 
          ? 'bg-red-100 text-red-600 hover:bg-red-300 rotate-180' 
          : 'hover:bg-earth-cream hover:text-earth-stone bg-earth-sage/30 text-earth-sage'
        }
      `}
    >
      <div className="transition-transform duration-300">
        {isChristmas ? (
          // ตอนเป็นคริสต์มาส -> โชว์โลกให้กดกลับ
          <Earth size={15} />
        ) : (
          // ตอนเป็นธีมปกติ -> โชว์เกล็ดหิมะให้กดเปิด
          <Snowflake size={15} />
        )}
      </div>
    </button>
  );
}