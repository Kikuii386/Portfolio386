'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
};

export default function Tooltip({
  content,
  children,
  side = 'top',
  className = '', // ✅ 2. รับค่า className มา (Default เป็นว่าง)
}: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (triggerRef.current) {
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
    }
    setShouldRender(true);

    setTimeout(() => setIsHovered(true), 10);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);

    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* ส่วน Trigger (ปุ่มเดิม) */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative flex items-center justify-center w-fit h-fit ${className}`}
      >
        {children}
      </div>

      {/* ส่วน Tooltip (ย้ายไป render ที่ body เพื่อทะลุ overflow) */}
      {shouldRender &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`
              hidden sm:block fixed z-[110] px-2 py-1 text-xs font-medium 
              text-earth-cream bg-earth-darkbrown 
              border border-earth-cream/10 shadow-md rounded pointer-events-none
              
             
              transition-all duration-300 ease-in-out
              ${
                isHovered
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-1'
              }
            `}
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                side === 'top'
                  ? 'translate(-50%, -100%)'
                  : side === 'bottom'
                  ? 'translate(-50%, 0)'
                  : side === 'left'
                  ? 'translate(-100%, -50%)'
                  : 'translate(0, -50%)',
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
