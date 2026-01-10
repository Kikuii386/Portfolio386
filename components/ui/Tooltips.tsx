'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export default function Tooltip({
  content,
  children,
  side = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!triggerRef.current) return;

    // 1. คำนวณตำแหน่งปุ่ม
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;
    const gap = 8; // ระยะห่าง

    // 2. คำนวณตำแหน่ง Tooltip (Fixed Position)
    switch (side) {
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
    }

    setCoords({ top, left });
    setIsVisible(true);
  };

  return (
    <>
      {/* ส่วน Trigger (ปุ่มเดิม) */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className="relative flex items-center justify-center w-fit h-fit"
      >
        {children}
      </div>

      {/* ส่วน Tooltip (ย้ายไป render ที่ body เพื่อทะลุ overflow) */}
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[110] px-2 py-1 text-xs font-medium text-earth-cream bg-earth-darkbrown border border-earth-cream/10 shadow-md rounded pointer-events-none animate-in fade-in zoom-in-95 duration-500"
            style={{
              top: coords.top,
              left: coords.left,
              // ใช้ CSS Transform จัดกึ่งกลางตามทิศทาง
              transform:
                side === 'top'
                  ? 'translate(-50%, -100%)'
                  : side === 'bottom'
                  ? 'translate(-50%, 0)'
                  : side === 'left'
                  ? 'translate(-100%, -50%)'
                  : 'translate(0, -50%)', // right
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
