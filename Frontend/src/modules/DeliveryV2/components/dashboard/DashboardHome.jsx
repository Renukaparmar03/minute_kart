import React from 'react';
import DeliveryHeader from './DeliveryHeader';
import OnlineStatus from './OnlineStatus';
import EarningsCard from './EarningsCard';
import PromoBanner from './PromoBanner';
import QuickAccessGrid from './QuickAccessGrid';
import { useDeliveryStore } from '@/modules/DeliveryV2/store/useDeliveryStore';

export default function DashboardHome({ profileImage, onNavigate }) {
  const { isOnline, toggleOnline } = useDeliveryStore();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-poppins pb-24 max-w-md mx-auto relative">
      {/* 1. Top Dark Green Header */}
      <DeliveryHeader profileImage={profileImage} onProfileClick={() => onNavigate?.('profile')} />

      <div className="pt-3 px-4 space-y-4 relative z-10">
        {/* 2. Online / Offline Status Toggle */}
        <OnlineStatus isOnline={isOnline} onToggle={toggleOnline} />

        {/* 3. Today's Earnings Card */}
        <EarningsCard
          amount="842"
          deliveries={12}
          distance="5.8 km"
          onlineTime="4h 32m"
          onViewDetails={() => onNavigate?.('pocket')}
        />

        {/* 4. Promotional Banner */}
        <PromoBanner onClick={() => onNavigate?.('orders')} />

        {/* 5. Quick Access Grid */}
        <QuickAccessGrid onNavigate={onNavigate} />
      </div>
    </div>
  );
}
