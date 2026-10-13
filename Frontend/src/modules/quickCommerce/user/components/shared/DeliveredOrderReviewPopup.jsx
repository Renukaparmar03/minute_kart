import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Star, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { customerApi } from "../../services/customerApi";
import { orderAPI } from "@/services/api";
import { useUserNotifications } from "@food/hooks/useUserNotifications";
import { cn } from "@/lib/utils";

const REVIEW_SHOWN_KEY = "quickReviewShownOrders";

const getShownOrderIds = () => {
  try {
    const stored = localStorage.getItem(REVIEW_SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markOrderAsShown = (orderOrId) => {
  if (!orderOrId) return;
  try {
    const shown = getShownOrderIds();
    if (typeof orderOrId === "object") {
      if (orderOrId._id) shown.add(String(orderOrId._id));
      if (orderOrId.orderId) shown.add(String(orderOrId.orderId));
      if (orderOrId.id) shown.add(String(orderOrId.id));
      if (orderOrId.customOrderId) shown.add(String(orderOrId.customOrderId));
    } else {
      shown.add(String(orderOrId));
    }
    localStorage.setItem(REVIEW_SHOWN_KEY, JSON.stringify(Array.from(shown)));
  } catch (err) {
    console.error("[ReviewPopup] Failed to mark order as shown:", err);
  }
};

const isOrderDismissed = (order, shownIds) => {
  if (!order) return true;
  const idsToCheck = [
    order._id && String(order._id),
    order.orderId && String(order.orderId),
    order.id && String(order.id),
    order.customOrderId && String(order.customOrderId),
  ].filter(Boolean);

  return idsToCheck.some((id) => shownIds.has(id));
};

const isExcludedPath = (pathname) => {
  const p = (pathname || "").toLowerCase();
  return (
    p.includes("/cart") ||
    p.includes("/checkout") ||
    p.includes("/payment") ||
    p.includes("/order-success")
  );
};

export default function DeliveredOrderReviewPopup() {
  useUserNotifications(); // Start socket connection to listen for real-time status updates
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [productRatings, setProductRatings] = useState({});
  const [productComments, setProductComments] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handleClose = useCallback(() => {
    if (order) {
      markOrderAsShown(order);
    }
    setOpen(false);
    setOrder(null);
    setProductRatings({});
    setProductComments({});
  }, [order]);

  const checkForDeliveredOrders = useCallback(async (targetOrderId = null) => {
    // If popup is already open or user is currently in cart/checkout, skip
    if (openRef.current) return;
    if (isExcludedPath(window.location.pathname)) {
      console.log("[ReviewPopup] In checkout/cart path, skipping review check");
      return;
    }

    const token =
      localStorage.getItem("auth_customer") ||
      localStorage.getItem("user_accessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      "";
    if (!token) return;

    try {
      console.log("[ReviewPopup] Checking delivered orders...", { targetOrderId });
      const res = await customerApi.getMyOrders({}, { forceRefresh: true });

      const rawList =
        res?.data?.result ||
        res?.data?.results ||
        res?.data?.data?.orders ||
        res?.data?.data?.data ||
        res?.data?.data ||
        [];

      const orders = Array.isArray(rawList)
        ? rawList.filter((order) => {
            const type = order.orderType || order.module || "quick";
            const oid = String(order.orderId || order.id || order._id || "");
            return (
              type === "quick" ||
              oid.startsWith("QC") ||
              (!oid.startsWith("FOD") && !oid.startsWith("ORD") && type !== "food")
            );
          })
        : [];

      if (orders.length === 0) return;

      const shownIds = getShownOrderIds();
      const now = Date.now();
      const FIFTEEN_MINUTES = 15 * 60 * 1000;

      // Filter to delivered quick orders
      const deliveredOrders = orders.filter((o) => {
        const status = (o.orderStatus || o.status || "").toLowerCase();
        return status === "delivered" || status === "completed";
      });

      // Auto-suppress any older delivered orders (>15 mins ago) so historical orders never pop up
      let updatedShown = false;
      deliveredOrders.forEach((o) => {
        const deliveredTimeStr =
          o.deliveredAt || o.deliveryTime || o.updatedAt || o.createdAt;
        const deliveredTime = deliveredTimeStr ? new Date(deliveredTimeStr).getTime() : 0;
        const isAncient = deliveredTime > 0 && now - deliveredTime > FIFTEEN_MINUTES;

        if (isAncient && !isOrderDismissed(o, shownIds)) {
          markOrderAsShown(o);
          updatedShown = true;
        }
      });

      const currentShownIds = updatedShown ? getShownOrderIds() : shownIds;

      // Find the unrated delivered order:
      // If targetOrderId is specified (socket notification), prioritize that exact order.
      // Otherwise, pick the most recent order delivered within the last 15 minutes.
      const candidateOrder = deliveredOrders.find((o) => {
        if (isOrderDismissed(o, currentShownIds)) return false;

        const hasRating = o.ratings?.restaurant?.rating != null;
        if (hasRating) return false;

        if (targetOrderId) {
          const tid = String(targetOrderId).toLowerCase();
          return (
            String(o._id || "").toLowerCase() === tid ||
            String(o.orderId || "").toLowerCase() === tid ||
            String(o.id || "").toLowerCase() === tid
          );
        }

        // On mount: only trigger if delivered recently (within 15 minutes)
        const deliveredTimeStr =
          o.deliveredAt || o.deliveryTime || o.updatedAt || o.createdAt;
        const deliveredTime = deliveredTimeStr ? new Date(deliveredTimeStr).getTime() : 0;
        return deliveredTime > 0 && now - deliveredTime <= FIFTEEN_MINUTES;
      });

      if (candidateOrder) {
        console.log(
          "[ReviewPopup] Found unrated delivered order to show review:",
          candidateOrder._id || candidateOrder.orderId
        );
        // Pre-emptively record as shown so repeated triggers do not occur
        markOrderAsShown(candidateOrder);

        setTimeout(() => {
          if (!isExcludedPath(window.location.pathname)) {
            setOrder(candidateOrder);
            setOpen(true);
          }
        }, 1200);
      } else {
        console.log("[ReviewPopup] No eligible delivered orders requiring review popup");
      }
    } catch (err) {
      console.error("[ReviewPopup] Check failed:", err);
    }
  }, []);

  // Trigger check ONCE on initial mount (only if not on excluded checkout/cart path)
  useEffect(() => {
    if (!isExcludedPath(location.pathname)) {
      checkForDeliveredOrders();
    }
  }, []); // Runs once on initial mount

  // Trigger check on real-time order status notification socket events (when delivered)
  useEffect(() => {
    const handleOrderStatusNotification = (event) => {
      const payload = event?.detail || {};
      const status = (payload.status || payload.orderStatus || "").toLowerCase();
      console.log("[ReviewPopup] Socket event received:", payload);
      if (status === "delivered" || status === "completed") {
        console.log(
          "[ReviewPopup] Order delivered in real-time. Triggering review popup check!"
        );
        const targetId = payload.orderMongoId || payload.orderId;
        checkForDeliveredOrders(targetId);
      }
    };

    window.addEventListener("orderStatusNotification", handleOrderStatusNotification);
    return () => {
      window.removeEventListener("orderStatusNotification", handleOrderStatusNotification);
    };
  }, [checkForDeliveredOrders]);

  const handleSubmit = useCallback(async () => {
    const ratedProductIds = Object.keys(productRatings);
    if (ratedProductIds.length === 0) {
      toast.error("Please rate at least one product");
      return;
    }

    try {
      setSubmitting(true);
      if (order) {
        markOrderAsShown(order);
      }

      // 1. Submit product reviews concurrently
      const productReviewPromises = Object.entries(productRatings).map(
        ([prodId, rating]) =>
          customerApi.submitReview({
            productId: prodId,
            rating,
            comment: productComments[prodId] || "",
          })
      );

      await Promise.allSettled(productReviewPromises);

      // 2. Silently mark the order as rated in the backend by submitting a default store rating
      try {
        const targetId = order._id || order.orderId;
        await orderAPI.submitOrderRatings(targetId, {
          restaurantRating: 5,
          restaurantComment: "Product reviews submitted",
        });
      } catch (err) {
        console.debug("Silent order rating submit failed:", err);
      }

      toast.success("Thanks for reviewing the products!");
      handleClose();
    } catch (error) {
      console.error("Error submitting reviews:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit reviews. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [order, productRatings, productComments, handleClose]);

  if (!open || !order) return null;

  const items = order.items || [];

  return (
    <AnimatePresence>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-border"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-800 px-6 py-5 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" />
                Write a Review
              </h2>
              <p className="text-xs font-bold text-white/95 mt-0.5">
                Share your experience with the products
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
            {/* Product reviews list */}
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const prodId =
                    item.itemId || item.productId || item._id || "";
                  if (!prodId) return null;
                  const rating = productRatings[prodId] || 0;
                  const comment = productComments[prodId] || "";

                  return (
                    <div
                      key={prodId || idx}
                      className="p-5 bg-card dark:bg-neutral-800 rounded-[2rem] border border-border space-y-4 shadow-sm"
                    >
                      <p className="text-sm font-black text-foreground">
                        {item.name} {item.variantName && `(${item.variantName})`}
                      </p>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isActive = rating >= num;
                          return (
                            <button
                              key={`prod-${prodId}-${num}`}
                              type="button"
                              onClick={() =>
                                setProductRatings((prev) => ({
                                  ...prev,
                                  [prodId]: num,
                                }))
                              }
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95",
                                isActive
                                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                                  : "bg-card dark:bg-background text-slate-300 dark:text-slate-600 border border-border"
                              )}
                            >
                              <Star
                                className={cn("h-5.5 w-5.5", isActive && "fill-current")}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        rows={2}
                        value={comment}
                        onChange={(e) =>
                          setProductComments((prev) => ({
                            ...prev,
                            [prodId]: e.target.value,
                          }))
                        }
                        className="min-h-[70px] w-full rounded-2xl bg-card dark:bg-background border border-border p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0c831f]/20 text-foreground resize-none"
                        placeholder="What did you like or dislike?"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-center text-slate-500 font-bold">
                No items in this order to rate.
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={submitting || Object.keys(productRatings).length === 0}
                onClick={handleSubmit}
                className="h-14 w-full rounded-2xl bg-foreground font-black text-background shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="h-11 w-full rounded-2xl bg-muted/60 hover:bg-muted font-bold text-xs text-muted-foreground hover:text-foreground transition-all active:scale-95 flex items-center justify-center"
              >
                Not now, thanks
              </button>
            </div>

            {Object.keys(productRatings).length === 0 && (
              <p className="text-[10px] text-center font-bold uppercase tracking-widest text-slate-400">
                Please rate at least one product
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
