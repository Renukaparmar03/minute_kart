import React from 'react';
import { useAuth } from '@core/context/AuthContext';
import {
    HiOutlineLogout,
    HiOutlineUserCircle,
    HiOutlineBell,
    HiOutlineSearch,
    HiOutlineMenu,
    HiOutlineArrowLeft,
    HiOutlineShoppingCart,
    HiOutlineLocationMarker,
    HiOutlineChevronRight
} from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { sellerApi } from '@/modules/seller/services/sellerApi';
import { AnimatePresence } from 'framer-motion';
import NotificationPopup from './NotificationPopup';
import { toast } from 'sonner';

const Topbar = ({ onMenuClick }) => {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);

    const isDashboard = location.pathname === '/seller' || location.pathname === '/admin' || location.pathname === '/seller/' || location.pathname === '/admin/';
    
    const getPageTitle = (path) => {
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 1) {
            const lastSegment = segments[segments.length - 1];
            return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
        }
        return 'Dashboard';
    };
    const pageTitle = getPageTitle(location.pathname);
    const notificationRef = React.useRef(null);

    const isSeller = location.pathname.startsWith('/seller');

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        const q = (searchQuery || '').trim();
        if (!q) return;
        if (isSeller) {
            navigate(`/seller/products?q=${encodeURIComponent(q)}`);
        }
    };

    const fetchNotifications = async () => {
        try {
            // Only fetch for sellers for now as per request
            if (!isSeller) return;

            const response = await sellerApi.getNotifications();
            if (response.data.success) {
                setNotifications(response.data.result.notifications);
                setUnreadCount(response.data.result.unreadCount);
            }
        } catch (error) {
            console.error("Notif Fetch Error:", error);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isSeller]);

    // Handle Click Outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await sellerApi.markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await sellerApi.markAllNotificationsRead();
            fetchNotifications();
            toast.success("All caught up!");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (isSeller) {
        return (
            <header className={cn(
                "bg-primary text-white border-b-0 flex items-center justify-between shadow-md transition-all duration-300",
                "fixed top-0 left-0 right-0 z-50 h-16 px-3 md:hidden"
            )} style={{ width: '100%' }}>
                {/* Left: Store Info */}
                <div 
                    onClick={() => navigate('/seller/profile')}
                    className="flex items-center gap-3 md:gap-6 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-[15px] shrink-0">
                            {user?.name?.[0]?.toUpperCase() || 'R'}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[14px] md:text-[17px] font-bold text-white leading-none">{user?.name || "Raddison"}</h2>
                            <p className="text-[9px] md:text-[11px] font-medium text-white/80 flex items-center gap-0.5 mt-1 max-w-[80px] md:max-w-[120px] truncate">
                                <HiOutlineLocationMarker className="h-3 w-3 shrink-0" /> Corporate H...
                            </p>
                        </div>
                        <div className="bg-white/10 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1 border border-white/20 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            <span className="text-[10px] md:text-[11px] font-bold">Online</span>
                            <HiOutlineChevronRight className="h-3 w-3 ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center gap-1 md:gap-2">
                    <button className="p-1.5 md:p-2 text-white/90 hover:bg-white/10 rounded-full transition-colors">
                        <HiOutlineSearch className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                    
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-1.5 md:p-2 text-white/90 hover:bg-white/10 rounded-full transition-colors relative"
                        >
                            <HiOutlineBell className="h-5 w-5 md:h-6 md:w-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white/20"></span>
                            )}
                        </button>
                        <AnimatePresence>
                            {showNotifications && (
                                <NotificationPopup
                                    notifications={notifications}
                                    onMarkAsRead={handleMarkAsRead}
                                    onMarkAllAsRead={handleMarkAllAsRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={onMenuClick}
                        className="p-1.5 md:p-2 text-white/90 hover:bg-white/10 rounded-full transition-colors md:hidden"
                    >
                        <HiOutlineMenu className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                </div>
            </header>
        );
    }

    return (
        <header className={cn(
            "bg-white md:bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all duration-300",
            (role === 'admin' || role === 'seller')
                ? "fixed top-0 left-0 right-0 z-50 h-14 px-4 md:static md:h-16 md:px-6"
                : "fixed top-0 left-56 right-0 h-16 px-6 z-40"
        )}>
            <div className="flex items-center flex-1 mr-4 overflow-hidden">
                <button
                    onClick={onMenuClick}
                    className={cn(
                        "p-2.5 mr-2 rounded-xl transition-all duration-300 border shadow-sm",
                        "bg-gray-100/80 hover:bg-white text-gray-600 hover:text-primary hover:border-primary/20 border-transparent",
                        "md:hidden" // Only show on mobile
                    )}
                >
                    <HiOutlineMenu className="h-5 w-5" />
                </button>

                {!isDashboard && (
                    <div className="md:hidden flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1 -ml-1 rounded-xl transition-colors text-gray-700 hover:bg-gray-100"
                        >
                            <HiOutlineArrowLeft className="h-6 w-6" />
                        </button>
                        <h2 className="text-[17px] font-bold tracking-tight text-gray-900">{pageTitle}</h2>
                    </div>
                )}

                <form onSubmit={handleSearchSubmit} className={cn("relative w-full md:w-[400px] group", !isDashboard && "hidden md:block")}>
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-all duration-300" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100/50 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-500 outline-none"
                    />
                </form>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "p-2 rounded-xl transition-all duration-300 relative group text-gray-500 hover:bg-primary/5 hover:text-primary",
                            showNotifications && "bg-primary/5 text-primary"
                        )}
                    >
                        <HiOutlineBell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white shadow-sm"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <NotificationPopup
                                notifications={notifications}
                                onMarkAsRead={handleMarkAsRead}
                                onMarkAllAsRead={handleMarkAllAsRead}
                                onClose={() => setShowNotifications(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-gray-100 mx-1 md:block hidden"></div>
                <button
                    onClick={() => {
                        if (location.pathname.startsWith('/admin')) {
                            navigate('/admin/profile');
                        } else if (location.pathname.startsWith('/seller')) {
                            navigate('/seller/profile');
                        } else if (location.pathname.startsWith('/delivery')) {
                            navigate('/delivery/profile');
                        } else {
                            navigate('/profile');
                        }
                    }}
                    className="flex items-center space-x-2.5 p-1 pr-3 hover:bg-gray-50 rounded-xl transition-all duration-300 group ring-1 ring-transparent hover:ring-gray-100 shadow-sm hover:shadow-md"
                >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg group-hover:scale-105 transition-transform bg-gradient-to-br from-primary to-indigo-600 shadow-primary/20">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-xs font-bold leading-tight text-gray-900">{user?.name || 'Demo User'}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{user?.role || 'Member'}</p>
                    </div>
                </button>
                {!isSeller && (
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 font-bold text-xs shadow-sm hover:shadow-rose-100/50"
                    >
                        <HiOutlineLogout className="h-4 w-4" />
                        <span className="hidden lg:block">Sign Out</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Topbar;

