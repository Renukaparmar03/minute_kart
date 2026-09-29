import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardList,
    Box,
    Wallet,
    MoreHorizontal,
    ChevronDown,
    X
} from 'lucide-react';

import { useAuth } from '@/core/context/AuthContext';

const BottomNav = ({ navItems }) => {
    const { role } = useAuth();
    const location = useLocation();

    // Define the primary bottom nav items based on user role
    const primaryItems = role === 'admin' ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/admin/orders/all', icon: ClipboardList },
        { label: 'Products', path: '/admin/products', icon: Box },
        { label: 'Wallet', path: '/admin/wallet', icon: Wallet },
    ] : [
        { label: 'Dashboard', path: '/seller', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/seller/orders', icon: ClipboardList },
        { label: 'Products', path: '/seller/products', icon: Box },
        { label: 'Earnings', path: '/seller/earnings', icon: Wallet },
        { label: 'Explore', path: '/seller/explore', icon: MoreHorizontal },
    ];

    return (
        <div className={cn(
            "fixed z-[60] md:hidden flex items-center justify-around shadow-xl transition-all duration-300",
            role === 'seller'
                ? "bottom-4 left-4 right-4 h-16 bg-primary text-white rounded-3xl px-2 shadow-primary/30"
                : "bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        )}>
            {primaryItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center space-y-1 w-14 h-14 transition-all duration-300",
                        role === 'seller'
                            ? isActive 
                                ? "text-white bg-white/20 rounded-2xl shadow-sm" 
                                : "text-white/60 hover:text-white/80"
                            : isActive 
                                ? "text-primary" 
                                : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};

export default BottomNav;

