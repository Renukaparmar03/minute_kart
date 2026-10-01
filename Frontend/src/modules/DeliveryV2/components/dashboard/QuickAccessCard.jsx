import React from 'react';

export default function QuickAccessCard({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#EAF8F1] hover:bg-[#DEFAF2] border border-[#D6EFE2] rounded-2xl py-3.5 px-2 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-h-[82px]"
    >
      <div className="text-[#087A45]">
        <Icon className="w-6 h-6 stroke-[2.2]" />
      </div>
      <span className="text-[#18332A] font-medium text-xs tracking-tight">
        {label}
      </span>
    </button>
  );
}
