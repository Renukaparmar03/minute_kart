import React from 'react';

export default function PromoBanner({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="w-full rounded-[20px] overflow-hidden shadow-sm border border-[#E5ECE8] cursor-pointer active:scale-[0.99] transition-transform bg-[#FFF4A8]"
    >
      <img
        src="/deliverybanner.png"
        alt="More Orders, More Earnings!"
        className="w-full h-auto object-cover block rounded-[20px]"
      />
    </div>
  );
}
