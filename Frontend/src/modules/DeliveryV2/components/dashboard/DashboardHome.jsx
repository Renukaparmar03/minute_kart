import React, { useState, useEffect } from 'react';
import DeliveryHeader from './DeliveryHeader';
import OnlineStatus from './OnlineStatus';
import EarningsCard from './EarningsCard';
import PromoBanner from './PromoBanner';
import QuickAccessGrid from './QuickAccessGrid';
import { useDeliveryStore } from '@/modules/DeliveryV2/store/useDeliveryStore';
import { deliveryAPI } from '@food/api';

export default function DashboardHome({ profileImage, onNavigate }) {
  const { isOnline, toggleOnline } = useDeliveryStore();
  const [todayStats, setTodayStats] = useState({
    amount: "0",
    deliveries: 0,
    distance: "0 km",
    onlineTime: "0h 0m",
    loading: true
  });

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const res = await deliveryAPI.getEarnings({ period: 'today' });
        const summary = res?.data?.data?.summary || res?.data?.summary || res?.data?.data || res?.data || {};
        setTodayStats({
          amount: Number(summary.totalEarnings || summary.earnings || 0).toFixed(0),
          deliveries: Number(summary.totalOrders || summary.orders || 0),
          distance: summary.distance || `${(Number(summary.totalDistance) || 0).toFixed(1)} km`,
          onlineTime: summary.onlineTime || `${summary.totalHours || 0}h ${summary.totalMinutes || 0}m`,
          loading: false
        });
      } catch (e) {
        console.error("Failed to load today stats:", e);
        setTodayStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchTodayStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-poppins pb-24 max-w-md mx-auto relative">
      {/* 1. Top Dark Green Header */}
      <DeliveryHeader profileImage={profileImage} onProfileClick={() => onNavigate?.('profile')} />

      <div className="pt-3 px-4 space-y-4 relative z-10">
        {/* 2. Online / Offline Status Toggle */}
        <OnlineStatus isOnline={isOnline} onToggle={toggleOnline} />

        {/* 3. Today's Earnings Card */}
        <EarningsCard
          amount={todayStats.amount}
          deliveries={todayStats.deliveries}
          distance={todayStats.distance}
          onlineTime={todayStats.onlineTime}
          loading={todayStats.loading}
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
