import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function EarningsCard({
  amount = "842",
  deliveries = 12,
  distance = "5.8 km",
  onlineTime = "4h 32m",
  onViewDetails
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E5ECE8] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
      {/* Top Row: Label + View Details */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#18332A] font-semibold text-sm">
          Today's Earnings
        </span>
        <button
          onClick={onViewDetails}
          className="text-[#0A8F50] font-medium text-xs flex items-center gap-0.5 hover:underline active:scale-95 transition-transform"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Amount */}
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-[#087A45] font-bold text-3xl tracking-tight">
          ₹ {amount}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E5ECE8] mb-4" />

      {/* 3 Equal Metric Columns */}
      <div className="grid grid-cols-3 divide-x divide-[#E5ECE8] text-center">
        {/* Deliveries */}
        <div className="flex flex-col items-center pr-2">
          <span className="text-[#18332A] font-bold text-base sm:text-lg">
            {deliveries}
          </span>
          <span className="text-[#66736E] text-[11px] font-normal mt-0.5">
            Deliveries
          </span>
        </div>

        {/* Distance */}
        <div className="flex flex-col items-center px-2">
          <span className="text-[#18332A] font-bold text-base sm:text-lg">
            {distance}
          </span>
          <span className="text-[#66736E] text-[11px] font-normal mt-0.5">
            Distance
          </span>
        </div>

        {/* Online Time */}
        <div className="flex flex-col items-center pl-2">
          <span className="text-[#18332A] font-bold text-base sm:text-lg">
            {onlineTime}
          </span>
          <span className="text-[#66736E] text-[11px] font-normal mt-0.5">
            Online Time
          </span>
        </div>
      </div>
    </div>
  );
}
