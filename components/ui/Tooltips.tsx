'use client';

import React from 'react';

type TooltipProps = {
  content: string; // ข้อความที่จะโชว์
  children: React.ReactNode; // ปุ่มหรือไอคอนที่จะเอา Tooltip ไปครอบ
  side?: 'top' | 'right' | 'bottom' | 'left'; // ตำแหน่งที่จะโชว์ (Default คือ top)
};

export default function Tooltip({
  content,
  children,
  side = 'top',
}: TooltipProps) {
  // กำหนดตำแหน่งการลอย (Position Logic)
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3', // เหมือนใน Navbar ของคุณ
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  };

  return (
    <div className="group/tooltip relative flex items-center justify-center w-fit h-fit">
      {/* ตัวปุ่ม/ไอคอน */}
      {children}

      {/* ตัว Tooltip */}
      <span
        className={`
          absolute z-50 px-2 py-1 
          text-xs font-medium text-earth-cream whitespace-nowrap
          bg-earth-darkbrown border border-earth-cream/10 shadow-md rounded
          pointer-events-none opacity-0 transition-opacity duration-300 
          group-hover/tooltip:opacity-100
          ${positionClasses[side]} 
        `}
      >
        {content}
      </span>
    </div>
  );
}
