import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function OnlineStatus({ isOnline = true, onToggle }) {
  return (
    <div className="bg-white p-1.5 rounded-full border border-[#E5ECE8] shadow-sm flex items-center gap-1.5">
      {/* Online Button */}
      <button
        onClick={() => !isOnline && onToggle?.(true)}
        className={`flex-1 py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-200 ${
          isOnline
            ? 'bg-[#087A45] text-white shadow-sm font-semibold'
            : 'bg-transparent text-[#66736E] font-medium hover:bg-gray-50'
        }`}
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOnline ? 'bg-white/20' : 'bg-gray-200'}`}>
          <CheckCircle2 className={`w-3.5 h-3.5 ${isOnline ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <span className="text-sm">Online</span>
      </button>

      {/* Offline Button */}
      <button
        onClick={() => isOnline && onToggle?.(false)}
        className={`flex-1 py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-200 ${
          !isOnline
            ? 'bg-[#18332A] text-white shadow-sm font-semibold'
            : 'bg-transparent text-[#18332A] font-medium border border-[#E5ECE8] hover:bg-gray-50'
        }`}
      >
        <Circle className={`w-3.5 h-3.5 ${!isOnline ? 'text-white fill-white' : 'text-gray-400'}`} />
        <span className="text-sm">Go Offline</span>
      </button>
    </div>
  );
}
