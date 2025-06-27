import React from "react";

type TooltipProps = {
  message: string;
};

export default function Tooltip({ message }: TooltipProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none animate-fade-in">
      <span className="text-sm font-medium bg-earth-sage text-white px-4 py-3 rounded shadow whitespace-nowrap">
        {message}
      </span>
    </div>
  );
}