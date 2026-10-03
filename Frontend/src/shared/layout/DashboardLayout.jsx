import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { sellerApi } from '@/modules/seller/services/sellerApi';
import { useAuth } from '@/core/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Check, X, Clock, Volume2, VolumeX, Package, ShoppingBag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SellerOrdersContext from '@/modules/seller/context/SellerOrdersContext';
import SellerEarningsContext, { defaultEarnings } from '@/modules/seller/context/SellerEarningsContext';
import { getOrderSocket, onSellerOrderNew, onOrderStatusUpdate, onOrderCancelled } from '@/core/services/orderSocket';
import alertSound from '@/modules/Food/assets/audio/alert.mp3';
import { registerWebPushForCurrentModule } from '@/modules/Food/utils/firebaseMessaging';

const POLL_INTERVAL_MS = 15000;

const resolveAudioSource = (source, cacheKey = 'seller-alert') => {
    if (!source) return source;
    if (!import.meta.env.DEV) return source;
    const separator = source.includes('?') ? '&' : '?';
    return `${source}${separator}devcache=${cacheKey}`;
};

const resolveSellerReceivable = (order) => {
    const receivable = Number(order?.pricing?.receivable);
    if (Number.isFinite(receivable)) return receivable;

    const subtotal = Number(order?.pricing?.subtotal);
    const commission = Number(order?.pricing?.commission);
    if (Number.isFinite(subtotal) && Number.isFinite(commission)) {
        return Math.max(0, subtotal - commission);
    }

    const fallback = Number(order?.total ?? order?.pricing?.total);
    return Number.isFinite(fallback) ? fallback : 0;
};

const resolveItemImage = (item) => {
    const raw = item?.image || item?.imageUrl || item?.mainImage || item?.product?.mainImage || item?.productImage || item?.pic || item?.thumbnail || "";
    if (!raw) return "";
    const str = String(raw).trim();
    if (!str) return "";
    if (/^(https?:|\/\/|data:|blob:)/i.test(str)) return str;
    const cleanRaw = str.replace(/\/api(?:\/v\d+)?\/uploads\//i, "/uploads/");
    const base = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/api(?:\/v\d+)?\/?$/i, "").replace(/\/$/, "");
    return base ? `${base}${cleanRaw.startsWith('/') ? cleanRaw : `/${cleanRaw}`}` : cleanRaw;
};

/** Match server `sellerPendingExpiresAt` — never reset to a full 60s when the modal opens late. */
function secondsLeftUntilSellerExpiry(order) {
    if (!order) return 0;
    const raw = order.sellerPendingExpiresAt ?? order.expiresAt;
    if (!raw) return 60;
    const ms = new Date(raw).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
}

const isEarningsRoute = (path) =>
    path.includes('earnings') || path.includes('withdrawals') || path.includes('transactions');

const DashboardLayout = ({ children, navItems, title }) => {
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    const [shownOrderIds, setShownOrderIds] = useState(() => new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    /** Total seconds in this acceptance window (for progress bar), set when modal opens */
    const acceptWindowTotalRef = useRef(60);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const { user, logout, role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const approved = user?.approved !== false && (!user?.approvalStatus || user?.approvalStatus === "approved");
    const onboardingSubmitted = user?.onboardingSubmitted === true;
    const requiresOnboarding = !approved && (!onboardingSubmitted || user?.approvalStatus === "draft");

    // Force light theme by removing dark class and preventing it from being added
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        root.style.colorScheme = 'light';

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && root.classList.contains('dark')) {
                    root.classList.remove('dark');
                }
            });
        });

        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
            // Restore dark mode if it was selected in user panel
            if (localStorage.getItem('appTheme') === 'dark') {
                root.classList.add('dark');
                root.style.colorScheme = 'dark';
            }
        };
    }, []);

    // Shared data for seller – single source, avoids duplicate API calls
    const [sellerOrders, setSellerOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [sellerEarningsData, setSellerEarningsData] = useState(defaultEarnings);
    const [earningsLoading, setEarningsLoading] = useState(false);

    const shownOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);
    const newOrderAlertRef = useRef(null);
    const fetchOrdersRef = useRef(null);
    const earningsFetchedRef = useRef(false);
    const lastEarningsErrorToastAtRef = useRef(0);
    const alertAudioRef = useRef(null);

    useEffect(() => {
        shownOrderIdsRef.current = shownOrderIds;
    }, [shownOrderIds]);
    useEffect(() => {
        newOrderAlertRef.current = newOrderAlert;
        if (!newOrderAlert && alertAudioRef.current) {
            alertAudioRef.current.pause();
            alertAudioRef.current.currentTime = 0;
        }
    }, [newOrderAlert]);

    useEffect(() => {
        if (alertAudioRef.current) {
            alertAudioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        if (role === 'seller') {
            registerWebPushForCurrentModule(location.pathname).catch(console.error);
        }
    }, [role, location.pathname]);

    useEffect(() => {
        if (role !== 'seller') {
            setSellerOrders([]);
            setOrdersLoading(false);
            return;
        }
        setOrdersLoading(true);

        const fetchOrders = async () => {
            try {
                const res = await sellerApi.getOrders();
                if (!res?.data?.success) return;

                const payload = res.data.result || {};
                const rawOrders = Array.isArray(payload.items)
                    ? payload.items
                    : (res.data.results || []);
                const allOrders = Array.isArray(rawOrders) ? rawOrders : [];
                setSellerOrders(allOrders);

                const pendingOrders = allOrders.filter((o) => {
                    const ws = (o.workflowStatus || '').toUpperCase();
                    if (ws === 'SELLER_PENDING') return true;
                    return (o?.status || '').toLowerCase() === 'pending';
                });

                // Always process pending orders to show modal, even on initial load
                // (This ensures that refreshing the page or loading directly to a subpage will still trigger the alert)
                if (isFirstLoadRef.current) {
                    isFirstLoadRef.current = false;
                }

                const newOrder = pendingOrders.find((o) => !shownOrderIdsRef.current.has(o.orderId));
                // CRITICAL FIX: If a modal is showing, but the order is no longer in the pending list, clear it.
                // This handles cases where the parent (restaurant) rejected the mixed order and it disappeared from polling.
                if (newOrderAlertRef.current) {
                    const currentId = String(newOrderAlertRef.current.orderId);
                    const stillPending = pendingOrders.some(o => String(o.orderId) === currentId);
                    if (!stillPending) {
                        console.log(`[DashboardLayout] Clearing stale order modal: #${currentId} is no longer pending.`);
                        setNewOrderAlert(null);
                        newOrderAlertRef.current = null;
                    }
                }

                if (!newOrder || newOrderAlertRef.current) return;

                setNewOrderAlert(newOrder);
                setShownOrderIds((prev) => new Set(prev).add(newOrder.orderId));
                shownOrderIdsRef.current = new Set(shownOrderIdsRef.current).add(newOrder.orderId);
                newOrderAlertRef.current = newOrder;

                if (!alertAudioRef.current) {
                    alertAudioRef.current = new Audio(resolveAudioSource(alertSound));
                    alertAudioRef.current.loop = true;
                }
                alertAudioRef.current.muted = isMuted;
                alertAudioRef.current.currentTime = 0;
                alertAudioRef.current.play().catch(() => {});
            } catch (error) {
                console.error("Polling Error:", error);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrdersRef.current = fetchOrders;
        fetchOrders();
        const pollInterval = setInterval(fetchOrders, POLL_INTERVAL_MS);
        return () => clearInterval(pollInterval);
    }, [role]);

    useEffect(() => {
        if (role !== 'seller') return undefined;
        const getToken = () => localStorage.getItem('auth_seller');
        getOrderSocket(getToken);

        const offNew = onSellerOrderNew(getToken, () => {
            if (fetchOrdersRef.current) fetchOrdersRef.current();
        });

        const offStatus = onOrderStatusUpdate(getToken, (payload) => {
            const orderId = String(payload?.orderId || '').trim();
            if (!orderId) return;
            const raw = String(payload?.sellerStatus || payload?.orderStatus || '').trim().toLowerCase();
            if (!raw) return;

            // Terminal cancellation check – clear modal if this specific order is cancelled
            if (raw.includes('cancel')) {
                if (newOrderAlertRef.current && String(newOrderAlertRef.current.orderId) === orderId) {
                    setNewOrderAlert(null);
                    toast.error(`Order #${orderId} was cancelled by the customer/system.`);
                }
            }

            const nextStatus =
                raw === 'picked_up' ? 'out_for_delivery' :
                    raw === 'placed' || raw === 'created' ? 'pending' :
                        raw;
            const nextWorkflow = String(payload?.sellerWorkflowStatus || '').trim();

            setSellerOrders((prev) =>
                (Array.isArray(prev) ? prev : []).map((order) =>
                    String(order?.orderId || '') === orderId
                        ? {
                            ...order,
                            status: nextStatus,
                            ...(nextWorkflow ? { workflowStatus: nextWorkflow } : {}),
                        }
                        : order
                )
            );
        });

        const offCancel = onOrderCancelled(getToken, (payload) => {
            const orderId = String(payload?.orderId || '').trim();
            if (!orderId) return;
            
            if (newOrderAlertRef.current && String(newOrderAlertRef.current.orderId) === orderId) {
                setNewOrderAlert(null);
                toast.error(`Order #${orderId} has been cancelled.`);
            }
            
            // Also refresh orders to update list
            if (fetchOrdersRef.current) fetchOrdersRef.current();
        });

        return () => {
            offNew?.();
            offStatus?.();
            offCancel?.();
        };
    }, [role]);

    // Single earnings fetch when seller is on earnings/withdrawals/transactions – no duplicate calls
    useEffect(() => {
        if (role !== 'seller' || !isEarningsRoute(location.pathname)) {
            if (!isEarningsRoute(location.pathname)) earningsFetchedRef.current = false;
            return;
        }
        if (earningsFetchedRef.current) return;
        earningsFetchedRef.current = true;
        setEarningsLoading(true);

        sellerApi
            .getEarnings()
            .then((response) => {
                const raw = response?.data?.result ?? response?.data?.data;
                if (response?.data?.success && raw && typeof raw === 'object') {
                    setSellerEarningsData({
                        balances: raw.balances ?? {},
                        ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
                        monthlyChart: Array.isArray(raw.monthlyChart) ? raw.monthlyChart : [],
                    });
                }
            })
            .catch((err) => console.error("Earnings Fetch Error:", err))
            .finally(() => setEarningsLoading(false));
    }, [role, location.pathname]);

    // Keep earnings fresh while seller is on earnings-related pages (delivery updates can land after initial load).
    useEffect(() => {
        if (role !== 'seller') return undefined;
        if (!isEarningsRoute(location.pathname)) return undefined;

        const timer = setInterval(() => {
            refreshEarnings();
        }, POLL_INTERVAL_MS);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, location.pathname]);

    const refreshOrders = () => {
        if (fetchOrdersRef.current) fetchOrdersRef.current();
    };
    const refreshEarnings = () => {
        earningsFetchedRef.current = false;
        setEarningsLoading(true);
        sellerApi
            .getEarnings()
            .then((response) => {
                const raw = response?.data?.result ?? response?.data?.data;
                if (response?.data?.success && raw && typeof raw === 'object') {
                    setSellerEarningsData({
                        balances: raw.balances ?? {},
                        ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
                        monthlyChart: Array.isArray(raw.monthlyChart) ? raw.monthlyChart : [],
                    });
                }
            })
            .catch((err) => {
                console.error("Earnings Fetch Error:", err);
                const msg = err?.response?.data?.message || "Failed to refresh earnings";
                // Avoid toast spam if the tab stays open and backend is down.
                const now = Date.now();
                if (now - lastEarningsErrorToastAtRef.current > 30000) {
                    lastEarningsErrorToastAtRef.current = now;
                    toast.error(msg, { duration: 2500 });
                }
            })
            .finally(() => {
                setEarningsLoading(false);
                earningsFetchedRef.current = true;
            });
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Timer: driven by server expiry (sellerPendingExpiresAt), not a local 60s from modal open
    useEffect(() => {
        if (!newOrderAlert) return undefined;

        const left = secondsLeftUntilSellerExpiry(newOrderAlert);
        if (left <= 0) {
            setNewOrderAlert(null);
            toast.error("This order has already expired — you can no longer accept it.");
            return undefined;
        }

        acceptWindowTotalRef.current = left;
        setTimeLeft(left);

        const timer = setInterval(() => {
            const next = secondsLeftUntilSellerExpiry(newOrderAlertRef.current);
            setTimeLeft(next);
            if (next <= 0) {
                clearInterval(timer);
                setNewOrderAlert(null);
                toast.error("Order timed out!");
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [newOrderAlert]);

    const handleAcceptOrder = async (orderId) => {
        try {
            await sellerApi.updateOrderStatus(orderId, { status: 'confirmed' });
            toast.success(`Order #${orderId} Accepted!`);
            setNewOrderAlert(null);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Failed to accept order";
            toast.error(msg);
        }
    };

    const handleDeclineOrder = async (orderId) => {
        try {
            await sellerApi.updateOrderStatus(orderId, { status: 'cancelled' });
            toast.error(`Order #${orderId} Declined`);
            setNewOrderAlert(null);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Failed to update order";
            toast.error(msg);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    return (
        <div className={cn("min-h-screen mesh-gradient-light relative overflow-x-hidden", role === 'seller' && 'seller-theme')}>
            {/* Background Blobs for depth */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

            <Sidebar
                items={navItems}
                title={title}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className={cn("transition-all duration-300", (role === "admin" || role === "seller") ? "pl-0 md:pl-80" : "pl-80")}>
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className={cn("min-h-screen flex flex-col", (role === "admin" || role === "seller") ? "pt-20 md:pt-6 pb-24 md:pb-8" : "pt-20")}>
                    {role === 'seller' && requiresOnboarding && location.pathname !== '/seller/onboarding' && (
                        <div className="bg-red-500 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md mb-6 relative z-10 mx-4 sm:mx-6 lg:mx-8 rounded-lg mt-2 md:mt-0 flex-shrink-0 border border-red-600">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">Please complete your onboarding details to add products and start selling.</span>
                            </div>
                            <button 
                                onClick={() => navigate('/seller/onboarding')}
                                className="bg-white text-red-600 font-bold px-4 py-2 rounded-md text-sm hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap active:scale-95"
                            >
                                Complete Onboarding
                            </button>
                        </div>
                    )}
                    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 flex-1">
                        <SellerOrdersContext.Provider
                            value={{
                                orders: role === 'seller' ? sellerOrders : [],
                                ordersLoading: role === 'seller' ? ordersLoading : false,
                                refreshOrders,
                            }}>
                            <SellerEarningsContext.Provider
                                value={{
                                    earningsData: role === 'seller' ? sellerEarningsData : defaultEarnings,
                                    earningsLoading: role === 'seller' ? earningsLoading : false,
                                    refreshEarnings,
                                }}>
                                {children}
                            </SellerEarningsContext.Provider>
                        </SellerOrdersContext.Provider>
                    </div>
                </main>
            </div>

            {/* Global Order Alert Modal */}
            <AnimatePresence>
                {newOrderAlert && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col"
                        >
                            <button
                                onClick={toggleMute}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 z-10"
                                aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                            >
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>

                            <div className="flex flex-col items-center text-center overflow-y-auto custom-scrollbar">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 animate-bounce shrink-0">
                                    <BellRing className="h-8 w-8 text-primary" />
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">New Order Received!</h2>
                                <p className="text-slate-600 text-sm font-medium mb-3">
                                    Order <span className="text-primary font-bold">#{newOrderAlert.orderId}</span> • <span className="text-slate-900 font-bold">Rs {resolveSellerReceivable(newOrderAlert).toFixed(2)}</span>
                                </p>

                                {/* Timer Bar — width from real server deadline */}
                                <div className="w-full bg-slate-100 h-2 rounded-full mb-3 overflow-hidden shrink-0">
                                    <div
                                        className={cn(
                                            "h-full transition-[width] duration-1000 ease-linear",
                                            timeLeft < 15 ? "bg-rose-500" : "bg-primary",
                                        )}
                                        style={{
                                            width: `${acceptWindowTotalRef.current > 0 ? (timeLeft / acceptWindowTotalRef.current) * 100 : 0}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold mb-4 shrink-0">
                                    <Clock className={cn("h-4 w-4", timeLeft < 15 ? "text-rose-500 animate-pulse" : "text-slate-600")} />
                                    <span className={timeLeft < 15 ? "text-rose-500" : "text-slate-600"}>
                                        Accept within {timeLeft} {timeLeft === 1 ? "second" : "seconds"}
                                    </span>
                                </div>

                                {/* Items Breakdown */}
                                {(() => {
                                    const items = Array.isArray(newOrderAlert?.items)
                                        ? newOrderAlert.items
                                        : (Array.isArray(newOrderAlert?.products) ? newOrderAlert.products : []);
                                    return (
                                        <div className="w-full text-left bg-slate-50/80 rounded-2xl p-3 border border-slate-100 mb-4">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                                                    Ordered Items ({items.length})
                                                </span>
                                            </div>

                                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                {items.length > 0 ? (
                                                    items.map((item, idx) => {
                                                        const name = item?.name || item?.title || item?.productName || item?.item?.name || item?.product?.name || "Item";
                                                        const qty = Number(item?.quantity || item?.qty || item?.count || 1);
                                                        const price = Number(item?.price || item?.finalPrice || item?.unitPrice || item?.product?.price || 0);
                                                        const variant = item?.variant || item?.variantName || item?.unit || item?.product?.unit || item?.selectedVariant?.name || "";
                                                        const imgSrc = resolveItemImage(item);

                                                        return (
                                                            <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {imgSrc ? (
                                                                        <img
                                                                            src={imgSrc}
                                                                            alt={name}
                                                                            className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
                                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                                                            <Package className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 leading-snug">
                                                                            {name}
                                                                        </p>
                                                                        {variant && (
                                                                            <p className="text-[11px] font-medium text-slate-500 leading-tight">
                                                                                {variant}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0 text-right">
                                                                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-md">
                                                                        {qty}x
                                                                    </span>
                                                                    {price > 0 && (
                                                                        <span className="text-xs font-bold text-slate-900">
                                                                            ₹{(price * qty).toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-slate-400 text-center py-2">No items listed</p>
                                                )}
                                            </div>

                                            {(newOrderAlert?.note || newOrderAlert?.customerNote || newOrderAlert?.instructions) && (
                                                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-amber-700 bg-amber-50/80 p-2 rounded-lg flex items-start gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    <span className="font-medium">
                                                        Note: {newOrderAlert.note || newOrderAlert.customerNote || newOrderAlert.instructions}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-2 gap-3 w-full shrink-0">
                                    <button
                                        onClick={() => handleDeclineOrder(newOrderAlert.orderId)}
                                        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                                    >
                                        <X className="h-4 w-4" />
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleAcceptOrder(newOrderAlert.orderId)}
                                        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 text-sm"
                                    >
                                        <Check className="h-4 w-4" />
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {(role === "admin" || role === "seller") && <BottomNav navItems={navItems} />}
        </div>
    );
};

export default DashboardLayout;
