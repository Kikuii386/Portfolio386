import { ChevronDown } from 'lucide-react';

interface SortButtonProps {
  column: string;
  sortConfig: {
    key: string;
    direction: string;
  } | null;
  onSort: (column: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortButton({
  column,
  sortConfig,
  onSort,
  children,
  className = '',
}: SortButtonProps) {
  const isActive = sortConfig?.key === column;
  const isAsc =
    sortConfig?.direction === 'asc' || sortConfig?.direction === 'ascending';

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`
        flex items-center transition-colors group
        ${className}
        ${
          isActive
            ? 'text-earth-darkbrown'
            : 'text-earth-brown hover:text-earth-darkbrown'
        }
      `}
    >
      <span>{children}</span>
      <div
        className={`
          flex items-center justify-center overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          
          ${
            isActive
              ? 'w-4 ml-1 opacity-100 scale-100' // ตอนโผล่: กว้าง 16px, ชัด 100%, ขนาดปกติ
              : 'w-0 ml-0 opacity-0 scale-0' // ตอนซ่อน: กว้าง 0, จางหาย, หดเหลือ 0
          }
        `}
      >
        <ChevronDown
          size={16}
          className={`
            shrink-0 text-earth-sage
            transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isAsc ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </div>
    </button>
  );
}
