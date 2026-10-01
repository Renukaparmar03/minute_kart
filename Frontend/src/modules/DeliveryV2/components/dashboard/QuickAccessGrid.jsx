import React from 'react';
import QuickAccessCard from './QuickAccessCard';
import { 
  ClipboardList, 
  Wallet, 
  TicketPercent, 
  CircleHelp, 
  UserRound, 
  MoreHorizontal 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickAccessGrid({ onNavigate }) {
  const navigate = useNavigate();

  const items = [
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
      action: () => onNavigate ? onNavigate('orders') : navigate('/food/delivery/requests')
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      action: () => onNavigate ? onNavigate('pocket') : navigate('/food/delivery/pocket')
    },
    {
      id: 'incentives',
      label: 'Incentives',
      icon: TicketPercent,
      action: () => onNavigate ? onNavigate('incentives') : navigate('/food/delivery/pocket')
    },
    {
      id: 'support',
      label: 'Support',
      icon: CircleHelp,
      action: () => navigate('/food/delivery/help/tickets')
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserRound,
      action: () => onNavigate ? onNavigate('profile') : navigate('/food/delivery/profile')
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      action: () => onNavigate ? onNavigate('profile') : navigate('/food/delivery/profile')
    }
  ];

  return (
    <div className="w-full">
      <h2 className="text-[#18332A] font-bold text-base mb-3 tracking-tight">
        Quick Access
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <QuickAccessCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            onClick={item.action}
          />
        ))}
      </div>
    </div>
  );
}
