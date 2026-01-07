import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

// กำหนด Type ของ Props ที่ต้องส่งเข้ามา
type Props = {
  isOpen: boolean;
  onClose: () => void;
  viewMode: string;
  setViewMode: (mode: any) => void; // หรือระบุ Type ที่ชัดเจนกว่านี้ถ้ามี
  sortConfig: { key: string; direction: string } | null;
  requestSort: (key: string) => void;
  sortOptions: { key: string; label: string }[];
};

const MobileFilterDrawer = ({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  sortConfig,
  requestSort,
  sortOptions,
}: Props) => {
  return (
    <>
      {/* 1. Backdrop (พื้นหลังดำจางๆ) */}
      <div
        className={`
          md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        onClick={onClose}
      />

      {/* 2. Drawer Container */}
      <div
        className={`
          md:hidden fixed z-[70] w-[280px] h-full
          top-0 right-0
          bg-gradient-to-bl from-earth-darkbrown to-earth-brown shadow-2xl border-l border-white/10
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header Drawer */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/10">
          <span className="text-sm font-bold text-earth-cream uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Display Options
          </span>
          <button
            onClick={onClose}
            className="text-earth-cream/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content: Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* --- SECTION 1: VIEW MODE --- */}
          <div>
            <div className="text-xs font-bold text-earth-stone/60 uppercase tracking-widest mb-3 ml-1">
              View Mode
            </div>
            <div className="space-y-2">
              {[
                { id: 'total', label: 'Total Portfolio' },
                { id: 'high', label: 'High Value' },
                { id: 'low', label: 'Low Value' },
                { id: 'other', label: 'Other Assets' },
                { id: 'free', label: 'Free / Airdrop' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setViewMode(mode.id);
                    onClose(); // ปิดเมนูเมื่อเลือกเสร็จ
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border
                    ${
                      viewMode === mode.id
                        ? 'bg-earth-sage text-white border-earth-sage shadow-md'
                        : 'bg-white/5 border-white/5 text-earth-cream/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* --- SECTION 2: SORT BY --- */}
          <div>
            <div className="text-xs font-bold text-earth-stone/60 uppercase tracking-widest mb-3 ml-1">
              Sort By
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sortOptions.map((option) => {
                const isActive = sortConfig?.key === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => {
                      requestSort(option.key);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border
                      ${
                        isActive
                          ? 'bg-earth-cream text-earth-darkbrown border-earth-cream shadow-md'
                          : 'bg-white/5 border-white/5 text-earth-cream/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <span className="text-xs bg-black/10 px-1.5 py-0.5 rounded">
                        {sortConfig?.direction === 'ascending' ? 'ASC' : 'DESC'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Reset Button */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <button
            onClick={() => {
              setViewMode('total');
              requestSort('value');
              onClose();
            }}
            className="w-full py-3 rounded-xl border border-white/10 text-earth-cream/60 text-xs font-bold uppercase hover:bg-white/5 hover:text-white transition-all"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileFilterDrawer;