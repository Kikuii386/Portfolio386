'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. สร้าง Type ใหม่สำหรับ "กลุ่ม" ของตัวเลือก
export type DropdownGroup = {
  label?: string;
  items: string[];
};

type DropdownSelectProps = {
  options: DropdownGroup[];
  selected: string;
  onSelect: (value: string) => void;
  label?: string;
  buttonClass?: string;
  getLabel?: (key: string) => string;
};

export default function DropdownSelect({
  options,
  selected,
  onSelect,
  label,
  buttonClass = '',
  getLabel,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // เว้นระยะห่างจากปุ่มนิดหน่อย
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // ✅ 2. แก้ Click Outside ให้เช็คทั้งปุ่มและเมนูที่ลอยอยู่
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      // เพิ่ม TouchEvent
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('touchstart', handleClickOutside); // ✅ เพิ่มบรรทัดนี้
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside); // ✅ ล้างออกด้วย
    };
  }, [open]);

  return (
    <div className="relative ">
      {/* Label ด้านบน (ถ้ามี) */}
      {label && (
        <label className="block text-sm font-semibold text-earth-brown mb-1 ml-1 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* ปุ่มหลัก */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          group relative w-full inline-flex items-center justify-center 
          min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-medium
          shadow-sm transition-all duration-200 ease-in-out
          
          ${buttonClass}
        `}
      >
        <span className="truncate mr-2 ">
          {getLabel ? getLabel(selected) : selected.toUpperCase()}
        </span>

        <ChevronDown
          className={`
            h-4 w-4 transition-transform duration-300 ease-in-out text-current opacity-70
            ${open ? 'rotate-180' : 'rotate-0'}
            group-hover:opacity-100
          `}
          aria-hidden="true"
        />
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                key="portal-dropdown"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  minWidth: Math.max(coords.width, 180),
                  transformOrigin: 'top center',
                  zIndex: 30,
                }}
                className={`
                portal-dropdown-menu 
                rounded-xl bg-earth-cream/90
                p-2 shadow-xl ring-1 ring-black/5 border border-earth-cream/80
                backdrop-blur-md overflow-hidden
              `}
              >
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-earth-sage/20">
                  {options.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {group.label && (
                        <div className="px-3 py-2 text-sm font-bold text-earth-darkbrown uppercase tracking-wider select-none">
                          {group.label}
                        </div>
                      )}

                      {group.items.map((option) => {
                        const isSelected = selected === option;
                        return (
                          <button
                            key={option}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(option);
                              setOpen(false);
                            }}
                            className={`
                            group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm 
                            transition-all duration-300 ease-in-out text-left
                            ${isSelected
                                ? 'bg-earth-brown/80 text-white font-semibold'
                                : 'text-earth-brown hover:bg-earth-sage/80 hover:text-white'
                              }
                          `}
                          >
                            <span className="truncate">
                              {getLabel
                                ? getLabel(option)
                                : option.toUpperCase()}
                            </span>

                            {isSelected && (
                              <Check className="h-4 w-4 text-white ml-2 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {groupIndex < options.length - 1 && (
                        <div className="my-1 h-0.5 bg-earth-brown/50 mx-2 " />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
