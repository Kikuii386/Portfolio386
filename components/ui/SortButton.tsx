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
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center space-x-1 hover:text-primary transition-colors group"
    >
      <span>{children}</span>
      <div className="flex flex-col">
        <ChevronUp
          size={12}
          className={`${
            sortConfig.key === column && sortConfig.direction === "asc"
              ? "text-primary"
              : "text-gray-400 group-hover:text-primary"
          } -mb-1`}
        />
        <ChevronDown
          size={12}
          className={`${
            sortConfig.key === column && sortConfig.direction === "desc"
              ? "text-primary"
              : "text-gray-400 group-hover:text-primary"
          } -mt-1`}
        />
      </div>
    </button>
  );
}