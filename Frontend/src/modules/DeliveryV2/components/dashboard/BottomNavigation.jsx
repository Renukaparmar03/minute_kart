import React from 'react';
import { Home, ClipboardList, MapPin, Wallet, UserRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation({ currentTab = 'home', onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/food/delivery'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
      path: '/food/delivery/requests'
    },
    {
      id: 'map',
      label: 'Map',
      icon: MapPin,
      path: '/food/delivery/feed'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      path: '/food/delivery/pocket'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserRound,
      path: '/food/delivery/profile'
    }
  ];

  const handleTabClick = (item) => {
    if (onTabChange) {
      onTabChange(item.id);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5ECE8] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-50 py-2.5 px-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all active:scale-95 ${
                isActive ? 'text-[#087A45]' : 'text-[#66736E] opacity-80 hover:opacity-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[11px] ${isActive ? 'font-semibold text-[#087A45]' : 'font-medium text-[#66736E]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
