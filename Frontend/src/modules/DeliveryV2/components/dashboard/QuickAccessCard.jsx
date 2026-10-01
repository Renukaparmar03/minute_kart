import React from 'react';

export default function QuickAccessCard({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#EAF8F1] hover:bg-[#DEFAF2] border border-[#D6EFE2] rounded-2xl p-4 flex items-center gap-3.5 active:scale-95 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#087A45] shadow-xs shrink-0">
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>
      <span className="text-[#18332A] font-bold text-sm tracking-tight text-left">
        {label}
      </span>
    </button>
  );
}
