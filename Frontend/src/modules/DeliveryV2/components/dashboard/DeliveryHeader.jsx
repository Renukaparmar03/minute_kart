import React from 'react';
import { Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeliveryHeader({ profileImage, userName = "Delivery Partner", onProfileClick }) {
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/food/delivery/profile');
    }
  };

  return (
    <div className="bg-[#087A45] text-white pt-8 pb-5 px-4 rounded-none shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Side: Scooter Icon + App Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
            <Bike className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold tracking-tight text-white leading-tight">
              MinuteKart
            </h1>
            <span className="text-[11px] font-normal text-white/80 tracking-wide">
              Delivery Partner
            </span>
          </div>
        </div>

        {/* Right Side: Circular Profile Avatar */}
        <button
          onClick={handleAvatarClick}
          className="relative cursor-pointer active:scale-95 transition-transform"
          aria-label="Open Profile"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Active indicator dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#087A45] rounded-full"></span>
        </button>
      </div>
    </div>
  );
}
