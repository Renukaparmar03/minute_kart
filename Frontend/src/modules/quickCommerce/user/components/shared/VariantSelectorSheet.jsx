import React from "react";
import { createPortal } from "react-dom";
import { Plus, Minus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useToast } from "@shared/components/ui/Toast";
import { resolveQuickImageUrl, QUICK_IMAGE_FALLBACK, handleQuickImageError } from "../../utils/image";

export const hasProductVariants = (product) =>
  Array.isArray(product?.variants) && product.variants.length > 0;

const getVariantCartId = (product, variant) =>
  `${product.id || product._id}::${variant._id || variant.id || variant.sku || variant.name}`;

const getCartLineId = (item) => String(item.productId || item.itemId || item.id || item._id);

// Bottom sheet listing a product's variants with per-variant ADD / +/- controls
const VariantSelectorSheet = ({ product, isOpen, onClose }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  const close = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleAdd = async (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    if (Number(variant.stock ?? Infinity) <= 0) {
      showToast("This variant is out of stock", "error");
      return;
    }

    const variantId = getVariantCartId(product, variant);
    const vPrice = variant.salePrice > 0 ? variant.salePrice : variant.price;
    const vOriginalPrice = Math.max(vPrice, variant.price);
    const variantProduct = {
      ...product,
      id: variantId,
      _id: variantId,
      productId: variantId,
      itemId: variantId,
      name: `${product.name} (${variant.name})`,
      price: vPrice,
      originalPrice: vOriginalPrice,
      mrp: vOriginalPrice,
      weight: variant.name,
      stock: variant.stock,
      sku: variant.sku,
    };

    const result = await addToCart(variantProduct);
    if (result?.ok === false) {
      if (!result?.silent) {
        showToast(result.error || "Cannot add variant to cart", "error");
      }
      return;
    }
  };

  const handleIncrement = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId = getVariantCartId(product, variant);
    const item = cart.find((i) => getCartLineId(i) === variantId);
    if (!item) return;
    const stock = Number(variant.stock ?? Infinity);
    if (item.quantity >= stock) {
      showToast(`Only ${stock} in stock`, "error");
      return;
    }
    updateQuantity(variantId, 1);
  };

  const handleDecrement = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId = getVariantCartId(product, variant);
    const item = cart.find((i) => getCartLineId(i) === variantId);
    if (!item) return;
    if (item.quantity === 1) {
      removeFromCart(variantId);
    } else {
      updateQuantity(variantId, -1);
    }
  };

  if (!isOpen || !hasProductVariants(product) || typeof window === "undefined") return null;

  return createPortal(
    <div className="quick-theme-scope">
      <AnimatePresence>
        <div
          className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={close}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-[480px] rounded-t-[24px] bg-white dark:bg-neutral-900 p-5 shadow-2xl flex flex-col max-h-[80vh] relative pointer-events-auto mb-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Close Button */}
            <button
              onClick={close}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Product Name Title */}
            <h3 className="text-[16px] font-black pr-8 text-[#17212f] dark:text-white leading-tight mb-4 text-left">
              {product.name}
            </h3>

            {/* Variants List */}
            <div className="overflow-y-auto space-y-3 max-h-[50vh] pr-1 py-1">
              {product.variants.map((v, idx) => {
                const variantId = getVariantCartId(product, v);
                const variantQty = cart
                  .filter((item) => getCartLineId(item) === variantId)
                  .reduce((sum, item) => sum + item.quantity, 0);

                const vPrice = v.salePrice > 0 ? v.salePrice : v.price;
                const vOriginalPrice = Math.max(vPrice, v.price);
                const hasDiscount = vOriginalPrice > vPrice;
                const discountPct = hasDiscount
                  ? Math.round(((vOriginalPrice - vPrice) / vOriginalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={v.sku || idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Variant Image Wrapper */}
                      <div className="relative w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-1 flex-shrink-0">
                        {hasDiscount && (
                          <span className="absolute top-0.5 left-0.5 z-10 bg-blue-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded leading-none shadow-sm scale-90 origin-top-left">
                            {discountPct}% OFF
                          </span>
                        )}
                        <img
                          src={resolveQuickImageUrl(product.image || product.mainImage)}
                          alt={v.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = QUICK_IMAGE_FALLBACK;
                          }}
                        />
                      </div>

                      <div className="flex flex-col text-left">
                        <span className="text-[13px] font-black text-slate-800 dark:text-neutral-200">
                          {v.name}
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-[14px] font-black text-[#0c831f]">
                            ₹{vPrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                              ₹{vOriginalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variant Action Button */}
                    <div>
                      {variantQty > 0 ? (
                        <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-sm h-8 overflow-hidden w-[72px] justify-between">
                          <button
                            onClick={(e) => handleDecrement(e, v)}
                            className="w-6 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                          >
                            <Minus size={10} strokeWidth={4} />
                          </button>
                          <span className="text-[11px] font-black min-w-[16px] text-center">
                            {variantQty}
                          </span>
                          <button
                            onClick={(e) => handleIncrement(e, v)}
                            className="w-6 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                          >
                            <Plus size={10} strokeWidth={4} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAdd(e, v)}
                          className="flex items-center justify-center bg-white dark:bg-neutral-800 border border-[#0c831f] text-[#0c831f] rounded-xl shadow-sm transition-all duration-300 active:scale-95 w-[72px] h-8 font-black text-[11px] hover:bg-[#0c831f]/5"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </div>,
    document.body,
  );
};

export default VariantSelectorSheet;
