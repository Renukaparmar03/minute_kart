import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Minus, Plus, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@food/components/ui/button";
import { useCart } from "@food/context/CartContext";
import { useProfile } from "@food/context/ProfileContext";
import { sanitizeOrderImage, sanitizeOrderNotes } from "@food/utils/orderPayload";
import { orderAPI } from "@food/api";
import { initRazorpayPayment } from "@food/utils/razorpay";
import { useCompanyName } from "@food/hooks/useCompanyName";
import { useSettings } from "@core/context/SettingsContext";

import zoopSound from "@food/assets/audio/zomato_sms.mp3";

const RUPEE_SYMBOL = "\u20B9";

const formatFullAddress = (address) => {
  if (!address) return "";
  if (address.formattedAddress && address.formattedAddress !== "Select location") {
    return address.formattedAddress;
  }

  const parts = [
    address.street,
    address.additionalDetails,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(", ");
  return address.address || "";
};

const getAddressId = (address) =>
  address?._id || address?.id || address?.addressId || address?.placeId || null;

const normalizeAddressLabel = (label) => {
  const value = String(label || "").trim().toLowerCase();
  if (value === "home") return "Home";
  if (value === "office" || value === "work") return "Office";
  return "Other";
};

const isMongoIdLike = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || "").trim());

const getQuickSourceId = (item) =>
  String(
    item?.sourceId ||
      item?.quickStoreId ||
      item?.storeId ||
      item?.sellerId ||
      item?.restaurantId ||
      "",
  ).trim();

const buildOrderAddress = (address, userProfile) => ({
  label: normalizeAddressLabel(address?.label),
  name: userProfile?.name || "Customer",
  street:
    address?.street ||
    address?.address ||
    address?.formattedAddress ||
    "Address unavailable",
  additionalDetails: address?.additionalDetails || "",
  city: address?.city || address?.area || "NA",
  state: address?.state || address?.city || "NA",
  zipCode: address?.zipCode || address?.postalCode || "",
  phone: address?.phone || userProfile?.phone || "",
  ...(Array.isArray(address?.location?.coordinates)
    ? {
        location: {
          type: "Point",
          coordinates: address.location.coordinates,
        },
      }
    : {}),
});

const mapCartItemsToPayload = (cart) =>
  cart.map((item) => ({
    itemId: String(item.id || item._id),
    name: item.name || "Item",
    type: "quick",
    sourceId: getQuickSourceId(item),
    sourceName: item.sourceName || item.quickStoreName || item.storeName || "Quick Commerce",
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    image: sanitizeOrderImage(item.image || item.imageUrl || ""),
    weight: item.weight,
    unit: item.unit,
    variantName: item.variantName || item.variant,
    packSize: item.packSize || item.size,
    volume: item.volume,
    isVeg: item.isVeg ?? true,
    notes: sanitizeOrderNotes(item.notes || ""),
  }));

export default function QuickSharedCart({ initialAddress = null, addressMode = "saved" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQuantity, clearCart } = useCart();
  const { addresses = [], getDefaultAddress, userProfile } = useProfile();
  const companyName = useCompanyName();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [pricing, setPricing] = useState(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const orderSuccessAudioRef = useRef(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.codEnabled === false && selectedPaymentMethod === "cash") {
      setSelectedPaymentMethod("razorpay");
    }
  }, [settings?.codEnabled, selectedPaymentMethod]);

  const quickCart = useMemo(
    () => cart.filter((item) => (item.orderType || "food") === "quick"),
    [cart],
  );

  const savedAddress = getDefaultAddress?.() || null;

  const defaultAddress = useMemo(() => {
    if (initialAddress) return initialAddress;
    return savedAddress;
  }, [initialAddress, savedAddress]);

  useEffect(() => {
    const defaultId = getAddressId(defaultAddress);
    if (defaultId && !selectedAddressId) {
      setSelectedAddressId(defaultId);
    }
  }, [defaultAddress, selectedAddressId]);

  useEffect(() => {
    const audio = new Audio(zoopSound);
    audio.preload = "auto";
    audio.volume = 0.8;
    orderSuccessAudioRef.current = audio;

    return () => {
      if (orderSuccessAudioRef.current) {
        orderSuccessAudioRef.current.pause();
        orderSuccessAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showOrderSuccess || !orderSuccessAudioRef.current) return;
    orderSuccessAudioRef.current.currentTime = 0;
    orderSuccessAudioRef.current.play().catch((error) => {
      console.warn("Order success sound blocked by browser:", error?.message || error);
    });
  }, [showOrderSuccess]);

  const selectedAddress = useMemo(() => {
    if (initialAddress) return initialAddress;
    if (!selectedAddressId) return savedAddress;
    return (
      addresses.find((address) => getAddressId(address) === selectedAddressId) ||
      savedAddress
    );
  }, [addresses, savedAddress, selectedAddressId, initialAddress]);

  useEffect(() => {
    if (quickCart.length === 0) {
      setPricing(null);
      setIsPricingLoading(false);
      return;
    }

    const subtotalValue = quickCart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    );
    const deliveryFeeValue = 25;
    const platformFeeValue = 0;
    const taxValue = 0;
    const totalValue = subtotalValue + deliveryFeeValue + platformFeeValue + taxValue;

    setPricing({
      subtotal: subtotalValue,
      deliveryFee: deliveryFeeValue,
      platformFee: platformFeeValue,
      tax: taxValue,
      discount: 0,
      packagingFee: 0,
      total: totalValue,
      currency: "INR",
    });
    setIsPricingLoading(false);
  }, [quickCart]);

  const subtotal = pricing?.subtotal || quickCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const deliveryFee = pricing?.deliveryFee || 0;
  const platformFee = pricing?.platformFee || 0;
  const tax = pricing?.tax || 0;
  const total = pricing?.total || subtotal + deliveryFee + platformFee + tax;

  const handlePlaceOrder = async () => {
    if (quickCart.length === 0) {
      toast.error("Your quick cart is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address first");
      navigate("/cart/address-selector", { state: { from: location.pathname } });
      return;
    }

    const invalidQuickItems = quickCart.filter((item) => !isMongoIdLike(getQuickSourceId(item)));
    if (invalidQuickItems.length > 0) {
      console.error("Quick cart contains items without a valid seller/store id", invalidQuickItems);
      toast.error("Some quick-cart items are missing store info. Clear the cart and add them again.");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const deliveryAddress = buildOrderAddress(selectedAddress, userProfile);
      const orderPayload = {
        orderType: "quick",
        items: mapCartItemsToPayload(quickCart),
        address: deliveryAddress,
        customerName: userProfile?.name || "Customer",
        customerPhone: deliveryAddress.phone,
        pricing: {
          subtotal,
          deliveryFee,
          platformFee,
          tax,
          discount: pricing?.discount || 0,
          packagingFee: pricing?.packagingFee || 0,
          total,
          currency: pricing?.currency || "INR",
        },
        paymentMethod: selectedPaymentMethod,
      };

      const orderResponse = await orderAPI.createOrder(orderPayload);
      const { order, razorpay } = orderResponse?.data?.data || {};

      if (selectedPaymentMethod === "cash") {
        toast.success("Quick order placed successfully");
        setPlacedOrderId(order?._id || order?.orderId || order?.id);
        setPlacedOrderData(order || null);
        setShowOrderSuccess(true);
        window.dispatchEvent(new CustomEvent('order-placed', { detail: { order } }));
        clearCart();
        setIsPlacingOrder(false);
        return;
      }

      if (!razorpay?.orderId || !razorpay?.key) {
        throw new Error("Payment gateway is not ready");
      }

      await initRazorpayPayment({
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency || "INR",
        order_id: razorpay.orderId,
        name: companyName,
        description: `Quick order ${order?.orderId || ""}`,
        prefill: {
          name: userProfile?.name || "",
          email: userProfile?.email || "",
          contact: String(deliveryAddress.phone || "").replace(/\D/g, "").slice(-10),
        },
        notes: {
          orderId: order?._id || order?.orderId || "",
          orderType: "quick",
        },
        handler: async (response) => {
          const verifyResponse = await orderAPI.verifyPayment({
            orderId: order?._id || order?.id || order?.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyResponse?.data?.success) {
            toast.success("Quick order placed successfully");
            setPlacedOrderId(order?._id || order?.orderId || order?.id);
            setPlacedOrderData(order || null);
            setShowOrderSuccess(true);
            window.dispatchEvent(new CustomEvent('order-placed', { detail: { order } }));
            clearCart();
            setIsPlacingOrder(false);
            return;
          }

          throw new Error("Payment verification failed");
        },
        onClose: async () => {
          try {
            const cancelId = order?._id || order?.id || order?.orderId;
            if (cancelId) {
              await orderAPI.cancelOrder(cancelId, {
                reason: "Payment Cancelled",
                note: "User closed payment modal in Quick Cart",
              });
            }
          } catch (err) {
            console.error("Failed to cancel quick order after close", err);
          }
          setIsPlacingOrder(false);
        },
        onError: async (error) => {
          try {
            const cancelId = order?._id || order?.id || order?.orderId;
            if (cancelId) {
              await orderAPI.cancelOrder(cancelId, {
                reason: "Payment Failed",
                note: error?.message || "Payment failed in Quick Cart",
              });
            }
          } catch (err) {
            console.error("Failed to cancel quick order after error", err);
          }
          setIsPlacingOrder(false);
        },
      });
    } catch (error) {
      console.error("Quick shared order failed", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          error?.message ||
          "Could not place quick order",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleGoToOrders = () => {
    const targetId = placedOrderId || placedOrderData?._id || placedOrderData?.orderId || placedOrderData?.id;
    if (targetId) {
      navigate(`/food/user/orders/${targetId}?confirmed=true`, {
        state: placedOrderData ? { prefetchedOrder: placedOrderData } : undefined,
      });
    } else {
      navigate("/food/user/orders");
    }
  };

  if (quickCart.length === 0 && !showOrderSuccess) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">Your quick cart is empty</h1>
          <p className="mt-2 text-sm text-slate-500">Add a few essentials and come back here for checkout.</p>
          <Link
            to="/quick"
            className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/quick")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quick shopping
        </button>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Shared Cart</p>
                  <h1 className="mt-1 text-2xl font-black text-slate-900">Quick checkout in the food flow</h1>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm font-semibold text-slate-500 hover:text-rose-600"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {quickCart.map((item) => (
                <article
                  key={item.id || item._id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    <img
                      src={item.image || item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                        {item.quickStoreName || "Quick Commerce"}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-black text-slate-900">{item.name}</h2>
                      <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
                        <p className="text-base font-bold text-slate-900">
                          {RUPEE_SYMBOL}
                          {Number(item.price || 0) * Number(item.quantity || 1)}
                        </p>
                        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id || item._id, Math.max(0, Number(item.quantity || 1) - 1))}
                            className="rounded-full p-1 text-slate-700 hover:bg-white"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id || item._id, Number(item.quantity || 1) + 1)}
                            className="rounded-full p-1 text-slate-700 hover:bg-white"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Delivery Address</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedAddress ? formatFullAddress(selectedAddress) : "Add a delivery address"}
                  </p>
                </div>
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <button
                type="button"
                onClick={() => navigate("/cart/address-selector", { state: { from: location.pathname } })}
                className="mt-4 text-sm font-bold text-emerald-700"
              >
                {selectedAddress ? "Change address" : "Select address"}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Payment</p>
              <div className="mt-4 grid gap-3">
                {settings?.codEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("cash")}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                      selectedPaymentMethod === "cash"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-3 font-semibold text-slate-900">
                      <Wallet className="h-4 w-4" />
                      Cash on delivery
                    </span>
                    <span className="text-xs font-bold text-slate-500">Pay later</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("razorpay")}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                    selectedPaymentMethod === "razorpay"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-3 font-semibold text-slate-900">
                    <CreditCard className="h-4 w-4" />
                    Pay online
                  </span>
                  <span className="text-xs font-bold text-slate-500">UPI / Card</span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Summary</p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{RUPEE_SYMBOL}{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span>{RUPEE_SYMBOL}{deliveryFee.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee</span>
                  <span>{RUPEE_SYMBOL}{platformFee.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>{RUPEE_SYMBOL}{tax.toFixed(0)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 text-base font-black text-white">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{RUPEE_SYMBOL}{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || isPricingLoading}
                className="mt-5 h-12 w-full rounded-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              >
                {isPlacingOrder
                  ? selectedPaymentMethod === "razorpay"
                    ? "Opening payment..."
                    : "Placing order..."
                  : isPricingLoading
                    ? "Refreshing total..."
                    : selectedPaymentMethod === "razorpay"
                      ? "Pay & place quick order"
                      : "Place quick order"}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
          100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes sparkle {
          0% { transform: rotate(var(--rotation, 0deg)) translateY(0) scale(0); opacity: 1; }
          100% { transform: rotate(var(--rotation, 0deg)) translateY(-80px) scale(1); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
      `}</style>

      {/* Order Success Celebration Page */}
      {showOrderSuccess && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-white flex h-screen w-full flex-col items-center justify-center overflow-hidden"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#10b981', '#059669', '#34d399', '#047857'][Math.floor(Math.random() * 4)],
                  animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center px-6">
            <div
              className="relative mb-8"
              style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
            >
              <div
                className="absolute inset-0 w-32 h-32 rounded-full border-4 border-emerald-500"
                style={{
                  animation: 'ringPulse 1.5s ease-out infinite',
                  opacity: 0.3
                }}
              />
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200/60">
                <svg
                  className="w-16 h-16 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'checkDraw 0.5s ease-out 0.5s both' }}
                >
                  <path d="M5 12l5 5L19 7" className="check-path" />
                </svg>
              </div>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    animation: `sparkle 0.6s ease-out ${0.3 + i * 0.1}s both`,
                    transform: `rotate(${i * 60}deg) translateY(-80px)`,
                  }}
                />
              ))}
            </div>

            <div
              className="text-center"
              style={{ animation: 'slideUp 0.5s ease-out 0.6s both' }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-900">
                  {defaultAddress?.city || "Your Location"}
                </h2>
              </div>
              <p className="text-slate-500 text-base max-w-sm">
                {defaultAddress ? (formatFullAddress(defaultAddress) || "Delivery Address") : "Delivery Address"}
              </p>
            </div>

            <div
              className="mt-12 text-center"
              style={{ animation: 'slideUp 0.5s ease-out 0.8s both' }}
            >
              <h3 className="text-3xl font-black text-emerald-600 mb-2">Order Placed!</h3>
              <p className="text-slate-600 font-medium">Your quick essentials are on their way</p>
            </div>

            <button
              onClick={handleGoToOrders}
              className="mt-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-12 rounded-full shadow-lg shadow-emerald-200 transition-all hover:scale-105"
              style={{ animation: 'slideUp 0.5s ease-out 1s both' }}
            >
              Track Your Order
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
