// components/SortButton.tsx
import { ChevronUp, ChevronDown } from "lucide-react";

interface SortButtonProps {
  column: string;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort: (column: string) => void;
  children: React.ReactNode;
}

export function SortButton({ column, sortConfig, onSort, children }: SortButtonProps) {
  const isActive = sortConfig.key === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center space-x-1 hover:text-primary transition-colors group"
    >
      <span>{children}</span>
      {isActive &&
        (sortConfig.direction === "asc" ? (
          <ChevronUp size={16} className="ml-1 text-primary" />
        ) : (
          <ChevronDown size={16} className="ml-1 text-primary" />
        ))}
    </button>
  );
}