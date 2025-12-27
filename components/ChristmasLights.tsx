'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ChristmasLights() {
  const { isChristmas } = useTheme();

  if (!isChristmas) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-between pointer-events-none overflow-hidden h-6" style={{ width: '120%', marginLeft: '-10%' }}>
        {/* สร้างไฟ 20 ดวงเรียงกัน */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`
            w-3 h-3 rounded-full shadow-md animate-pulse
            ${i % 3 === 0 ? 'bg-red-500 shadow-red-500/50' : ''}
            ${i % 3 === 1 ? 'bg-green-500 shadow-green-500/50' : ''}
            ${i % 3 === 2 ? 'bg-yellow-400 shadow-yellow-400/50' : ''}
          `}
          style={{
            marginTop: '-4px', // ให้เหมือนห้อยลงมา
            animationDuration: `${1 + Math.random()}s`, // กระพริบไม่พร้อมกัน
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
      ))}
      {/* สายไฟเชื่อม */}
      <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-800/30 rounded-[100%] h-4 translate-y-[-2px]" />
    </div>
  );
}