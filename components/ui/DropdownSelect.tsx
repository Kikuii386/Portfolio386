'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// 1. สร้าง Type ใหม่สำหรับ "กลุ่ม" ของตัวเลือก
export type DropdownGroup = {
  label?: string; // ชื่อหัวข้อกลุ่ม (เช่น "การแสดงผล", "ตั้งค่า") - ใส่หรือไม่ใส่ก็ได้
  items: string[]; // รายการตัวเลือกในกลุ่มนั้น
};

type DropdownSelectProps = {
  // 2. เปลี่ยน options ให้รับเป็น Array ของกลุ่มแทน
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
  const ref = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative z-20 " ref={ref}>
      {/* Label ด้านบน (ถ้ามี) */}
      {label && (
        <label className="block text-sm font-semibold text-earth-brown mb-1 ml-1 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* ปุ่มหลัก */}
      <button
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

      {/* เมนู Dropdown */}
      <div
        className={`
          absolute right-0 z-50 mt-2 w-full min-w-[180px] origin-top-right 
          rounded-xl bg-earth-darkbrown/70 p-2 shadow-xl ring-1 ring-black/5 border border-earth-brown/50
          transition-all duration-200 ease-out backdrop-blur-md
          ${
            open
              ? 'opacity-100 scale-100 translate-y-0 visible'
              : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}
      >
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-earth-sage/20">
          {/* 3. วนลูปแสดงผลทีละ "กลุ่ม" */}
          {options.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* ส่วนหัวข้อ (Header) - จะแสดงก็ต่อเมื่อมี label */}
              {group.label && (
                <div className="px-3 py-2 text-sm font-bold text-earth-cream uppercase tracking-wider select-none">
                  {group.label}
                </div>
              )}

              {/* รายการตัวเลือกในกลุ่มนั้น */}
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
                      transition-all duration-150 ease-in-out
                      ${
                        isSelected
                          ? 'bg-earth-cream/70 text-earth-darkbrown font-semibold'
                          : 'text-earth-stone hover:bg-earth-sage/20 hover:text-earth-sageleaf'
                      }
                    `}
                  >
                    <span className="truncate">
                      {getLabel ? getLabel(option) : option.toUpperCase()}
                    </span>

                    {/* ไอคอนติ๊กถูก */}
                    {isSelected && (
                      <Check className="h-4 w-4 text-earth-darkbrown ml-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* เส้นคั่น (Separator) - จะแสดงถ้าไม่ใช่กลุ่มสุดท้าย */}
              {groupIndex < options.length - 1 && (
                <div className="my-1 h-0.5 bg-earth-sage/30 mx-2 " />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
