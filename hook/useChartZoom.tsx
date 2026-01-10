import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';

// --- 🧠 PART 1: The Hook (Logic) ---
export const useChartZoom = (data: any[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: 0 });

  // 🔥 ใช้ Ref เก็บค่า Range ล่าสุด เพื่อไม่ต้อง Remove/Add Event Listener บ่อยๆ
  const rangeRef = useRef(range);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startRange = useRef({ start: 0, end: 0 });

  // Sync Ref กับ State เสมอ
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  // Init Data Range
  useEffect(() => {
    if (data && data.length > 0) {
      const DEFAULT_ITEMS = 30; // อยากโชว์กี่แท่งแก้เลขนี้ได้เลย
      const end = data.length - 1;
      const start = Math.max(0, end - DEFAULT_ITEMS + 1); // +1 เพื่อให้นับครบ 30 เป๊ะ

      setRange({ start, end });
    }
  }, [data]);

  // Logic ตัดข้อมูล (Slicing)
  const zoomedData = useMemo(() => {
    if (!data || !data.length) return [];
    const s = Math.max(0, Math.min(range.start, data.length - 1));
    const e = Math.min(data.length - 1, Math.max(range.end, s + 2));

    return data.slice(s, e + 1);
  }, [data, range]);

  // Event Listeners (Optimized with requestAnimationFrame)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rAFId: number | null = null; // ตัวแปรสำหรับ Throttle

    // 🖱️ Mouse Wheel & Magic Mouse Logic
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // ถ้ามีการคำนวณค้างอยู่ ให้ข้ามไปก่อน (Throttle)
      if (rAFId) return;

      rAFId = requestAnimationFrame(() => {
        if (!data || data.length < 5) {
          rAFId = null;
          return;
        }

        const currentRange = rangeRef.current; // อ่านจาก Ref ล่าสุด
        const currentLength = currentRange.end - currentRange.start;
        const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY);

        let newStart = currentRange.start;
        let newEnd = currentRange.end;

        if (isHorizontalSwipe) {
          // --- ↔️ Pan (Swipe) ---
          const PAN_SENSITIVITY = 0.5;
          const rect = container.getBoundingClientRect();
          const pixelsPerIndex = rect.width / (currentLength || 1);
          const moveIndex = (e.deltaX * PAN_SENSITIVITY) / pixelsPerIndex;

          newStart += moveIndex;
          newEnd += moveIndex;
        } else {
          // --- 🔍 Zoom ---
          const ZOOM_SPEED = 0.001;
          const delta = e.deltaY * currentLength * ZOOM_SPEED;
          const rect = container.getBoundingClientRect();
          const mouseRatio = (e.clientX - rect.left) / rect.width;

          newStart -= delta * mouseRatio;
          newEnd += delta * (1 - mouseRatio);
        }

        // Limit Checks
        if (newEnd - newStart < 5) {
          // ห้ามซูมลึกเกิน
          rAFId = null;
          return;
        }

        // Clamping (กันตกขอบ) - อนุญาตให้ Pan เกินได้นิดหน่อยแล้วดีดกลับ
        newStart = Math.max(0, newStart);
        newEnd = Math.min(data.length - 1, newEnd);

        // Update State
        setRange({ start: newStart, end: newEnd });

        // Reset rAF
        rAFId = null;
      });
    };

    // 👋 Drag Logic
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startRange.current = rangeRef.current;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      // Throttle MouseMove ด้วยเหมือนกัน
      if (rAFId) return;

      rAFId = requestAnimationFrame(() => {
        const moveX = e.clientX - startX.current;
        const rect = container.getBoundingClientRect();
        const totalVisible = startRange.current.end - startRange.current.start;

        if (totalVisible > 0) {
          const pixelsPerIndex = rect.width / totalVisible;
          const moveIndex = moveX / pixelsPerIndex;

          let newStart = startRange.current.start - moveIndex;
          let newEnd = startRange.current.end - moveIndex;

          // กันตกขอบ
          if (newStart < 0) {
            const diff = 0 - newStart;
            newStart += diff;
            newEnd += diff;
          }
          if (newEnd > data.length - 1) {
            const diff = data.length - 1 - newEnd;
            newStart += diff;
            newEnd += diff;
          }

          setRange({ start: newStart, end: newEnd });
        }
        rAFId = null;
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = 'default';
    };

    // Attach Events (Add only ONCE per data change)
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rAFId) cancelAnimationFrame(rAFId);
    };
  }, [data]); // 🔥 Dependency น้อยลง: ไม่ Re-bind เมื่อ range เปลี่ยนแล้ว!

  return { zoomedData, containerRef };
};

// --- 📦 PART 2: The Wrapper Component (UI) ---
interface WrapperProps {
  originalData: any[];
  children: (zoomedData: any[]) => ReactNode;
  className?: string;
}

export const ZoomableChartWrapper = ({
  originalData,
  children,
  className = '',
}: WrapperProps) => {
  const { zoomedData, containerRef } = useChartZoom(originalData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return <div className={`w-full h-full min-h-0 ${className}`} />;
  }

  return (
    <div
      ref={containerRef}
      className={`no-focus-zone w-full h-full min-h-0 cursor-default relative touch-none outline-none ${className}`}
      tabIndex={-1}
    >
      <style>{`
        .no-focus-zone,
        .no-focus-zone * {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
          -webkit-focus-ring-color: transparent !important;
        }
        .recharts-surface path,
        .recharts-surface rect,
        .recharts-surface line,
        .recharts-surface circle {
           outline: none !important;
           box-shadow: none !important;
        }
      `}</style>

      {children(zoomedData)}
    </div>
  );
};
