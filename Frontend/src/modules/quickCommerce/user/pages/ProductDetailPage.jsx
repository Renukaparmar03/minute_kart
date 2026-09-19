import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useHeroTransition } from "../context/HeroTransitionContext";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "@shared/components/ui/Toast";
import { customerApi } from "../services/customerApi";
import { resolveQuickImageUrl } from "../utils/image";
import ProductCard from "../components/shared/ProductCard";
import MiniCart from "../components/shared/MiniCart";

const getProductIdentifier = (value) =>
  String(value?.productId || value?.itemId || value?.id || value?._id || "").split("::")[0];

const normalizePrice = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanDescription = (text) => {
  if (!text) return "No description is available for this product yet.";

  const value = String(text).trim();
  if (!value) return "No description is available for this product yet.";

  if (value.startsWith("{\\rtf") || value.includes("\\par")) {
    const cleaned = value
      .replace(/\{\\[^}]*\}/g, " ")
      .replace(/\\[a-z]+\d*\s?/gi, " ")
      .replace(/\\'/g, "'")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned || "No description is available for this product yet.";
  }

  return value;
};

const normalizeProduct = (product = {}, fallback = {}) => {
  const source = { ...fallback, ...product };
  const imageCandidates = [
    source.mainImage,
    source.image,
    ...(Array.isArray(source.galleryImages) ? source.galleryImages : []),
  ]
    .map((image) => resolveQuickImageUrl(image) || image)
    .filter(Boolean);

  const images = [...new Set(imageCandidates)];
  const salePrice = normalizePrice(source.salePrice, 0);
  const basePrice = normalizePrice(source.price, salePrice);
  const price = salePrice > 0 ? salePrice : basePrice;
  const originalPrice = Math.max(
    price,
    normalizePrice(source.originalPrice ?? source.mrp ?? source.price, price),
  );
  const stock = normalizePrice(source.stock, 0);

  return {
    ...source,
    id: source.id || source._id,
    _id: source._id || source.id,
    name: source.name || "Product",
    category:
      source.category ||
      source.categoryName ||
      source.categoryId?.name ||
      "Quick Commerce",
    price,
    originalPrice,
    description: cleanDescription(source.description),
    images:
      images.length > 0
        ? images
        : ["https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop"],
    details: [
      {
        label: "Unit",
        value: source.weight || source.unit || "1 unit",
      },
      {
        label: "Stock",
        value: stock > 0 ? `${stock} available` : "Out of stock",
      },
      {
        label: "Brand",
        value: source.brand || "Quick Select",
      },
    ],
    storeName:
      source.storeName ||
      source.restaurantName ||
      source.seller?.name ||
      source.sellerId?.name ||
      source.store?.name ||
      source.storeId?.name ||
      "Fresh Mart",
    storeId:
      source.storeId?._id ||
      source.storeId ||
      source.store?._id ||
      source.store ||
      source.sellerId?._id ||
      source.sellerId ||
      source.seller?._id ||
      source.seller ||
      source.restaurantId?._id ||
      source.restaurantId ||
      null,
    deliveryTime: source.deliveryTime || "8-12 mins",
  };
};

const ProductDetailPage = () => {
  const { productId, id } = useParams();
  const resolvedProductId = productId || id;
  const location = useLocation();
  const navigate = useNavigate();

  // Hero transition integration
  const { heroState, onDetailMounted, triggerHeroCollapse } = useHeroTransition();
  const arrivedFromHero = location.state?.fromHero === true;
  // Start fully visible for shared elements, but reveal secondary content with transition
  const [isRevealed, setIsRevealed] = useState(true);
  const [revealSecondary, setRevealSecondary] = useState(!arrivedFromHero);

  // Tell the hero overlay to dismiss once this page has mounted
  useEffect(() => {
    if (arrivedFromHero) {
      onDetailMounted();
      // Set secondary content to reveal after the shared elements have settled
      const t = setTimeout(() => setRevealSecondary(true), 200);
      return () => clearTimeout(t);
    }
  }, [arrivedFromHero, onDetailMounted]);

  // Back handler — collapses hero overlay then pops the route
  const handleBack = () => {
    if (heroState.originRect && heroState.phase === 'idle') {
      // 1. Hide secondary info first
      setRevealSecondary(false);
      // 2. Wait for the fade out to finish (150ms)
      setTimeout(() => {
        // 3. Trigger the collapse animation
        triggerHeroCollapse(() => navigate(-1));
      }, 150);
    } else {
      navigate(-1);
    }
  };

  const initialProduct = useMemo(() => {
    const routeProduct = location.state?.product;
    return routeProduct ? normalizeProduct(routeProduct) : null;
  }, [location.state]);

  const [product, setProduct] = useState(initialProduct);
  const [activeImage, setActiveImage] = useState(initialProduct?.images?.[0] || "");
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return initialProduct.variants[0];
    }
    return null;
  });
  const [loadingProduct, setLoadingProduct] = useState(!initialProduct);
  const [productError, setProductError] = useState("");
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const detailScrollRef = React.useRef(null);

  useEffect(() => {
    setCurrentImgIdx(0);
    if (detailScrollRef.current) {
      detailScrollRef.current.scrollLeft = 0;
    }
  }, [resolvedProductId]);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist: toggleWishlistGlobal, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const currentVariantId = useMemo(() => {
    if (!product) return "";
    return selectedVariant ? `${product.id}::${selectedVariant.sku}` : product.id;
  }, [product, selectedVariant]);

  const quantity = useMemo(() => {
    if (!product) return 0;
    const cartItem = cart.find(
      (item) => (item.productId || item.itemId || item.id || item._id) === currentVariantId,
    );
    return cartItem ? cartItem.quantity : 0;
  }, [cart, product, currentVariantId]);

  const isWishlisted = product
    ? isInWishlist(product.id || product._id)
    : false;

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      if (!resolvedProductId) {
        setLoadingProduct(false);
        setProductError("Product id is missing from the route.");
        return;
      }

      setLoadingProduct(true);
      setProductError("");

      try {
        const response = await customerApi.getProductDetails(resolvedProductId);
        const result =
          response?.data?.result ||
          response?.data?.data ||
          response?.data?.product ||
          null;

        if (!result) {
          throw new Error("Product not found");
        }

        if (!cancelled) {
          const normalized = normalizeProduct(result, location.state?.product);
          setProduct(normalized);
          setActiveImage((currentImage) => currentImage || normalized.images[0]);
        }
      } catch (error) {
        if (!cancelled) {
          setProduct(null);
          setProductError(
            error?.response?.data?.message || "Unable to load this product.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [location.state, resolvedProductId]);

  useEffect(() => {
    if (product?.images?.length) {
      setActiveImage(product.images[0]);
    }
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      if (!resolvedProductId) {
        setReviewLoading(false);
        return;
      }

      setReviewLoading(true);

      try {
        const response = await customerApi.getProductReviews(resolvedProductId);
        if (!cancelled) {
          const rawReviews = response?.data?.results || [];
          const uniqueReviews = [];
          const seenKeys = new Set();
          
          rawReviews.forEach(review => {
            const id = review._id || review.id;
            const uniqueKey = `${review.userId || review.userName || ''}-${review.rating || 0}-${(review.comment || '').trim()}`;
            
            if (id && !seenKeys.has(id) && !seenKeys.has(uniqueKey)) {
              seenKeys.add(id);
              seenKeys.add(uniqueKey);
              uniqueReviews.push(review);
            } else if (!id && !seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              uniqueReviews.push(review);
            }
          });

          setReviews(uniqueReviews);
        }
      } catch (error) {
        if (!cancelled) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [resolvedProductId]);

  useEffect(() => {
    let cancelled = false;
    if (!product) return;

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const catId = product.subcategoryId?._id || product.subcategoryId || product.categoryId?._id || product.categoryId;
        const storeId = product.sellerId || product.storeId || (product.seller?._id || product.seller?.id);

        if (!catId) {
          setSimilarProducts([]);
          return;
        }

        const response = await customerApi.getProducts({
          categoryId: catId,
          storeId: storeId,
          limit: 20
        });

        if (!cancelled && response?.data?.success) {
          const rawResult = response.data.result;
          const dbProds = Array.isArray(response.data.results)
            ? response.data.results
            : Array.isArray(rawResult?.items)
              ? rawResult.items
              : Array.isArray(rawResult)
                ? rawResult
                : [];

          const formattedProds = dbProds.map(p => ({
            ...p,
            id: p._id || p.id,
            image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
            price: p.salePrice || p.price,
            originalPrice: p.price,
            weight: p.weight || p.unit || "1 unit",
            deliveryTime: "8-15 mins"
          }));

          const filtered = formattedProds.filter(p => String(p.id) !== String(product.id));
          setSimilarProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
        if (!cancelled) setSimilarProducts([]);
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      cancelled = true;
    };
  }, [product]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "4.8";
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlistGlobal(product);
    showToast(
      isWishlisted
        ? `${product.name} removed from wishlist`
        : `${product.name} added to wishlist`,
      isWishlisted ? "info" : "success",
    );
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedProductId || !newReview.comment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const response = await customerApi.submitReview({
        productId: resolvedProductId,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });

      if (response?.data?.success) {
        showToast("Review submitted for moderation", "success");
        setNewReview({ rating: 5, comment: "" });
      }
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to submit review",
        "error",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const displayPrice = selectedVariant
    ? (selectedVariant.salePrice > 0 ? selectedVariant.salePrice : selectedVariant.price)
    : (product?.price || 0);

  const displayOriginalPrice = selectedVariant
    ? Math.max(displayPrice, selectedVariant.price)
    : (product?.originalPrice || 0);

  const displayDiscount = displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0;

  const displayWeight = selectedVariant
    ? selectedVariant.name
    : (product?.weight || product?.unit || "1 unit");

  const displayStock = selectedVariant
    ? selectedVariant.stock
    : (product?.stock || 0);

  const variantProduct = useMemo(() => {
    if (!product) return null;
    if (!selectedVariant) return product;
    return {
      ...product,
      id: currentVariantId,
      _id: currentVariantId,
      productId: currentVariantId,
      itemId: currentVariantId,
      name: `${product.name} (${selectedVariant.name})`,
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      mrp: displayOriginalPrice,
      weight: selectedVariant.name,
      stock: selectedVariant.stock,
      sku: selectedVariant.sku,
    };
  }, [product, selectedVariant, currentVariantId, displayPrice, displayOriginalPrice]);

  const displayDetails = useMemo(() => {
    if (!product) return [];
    return [
      {
        label: "Unit",
        value: displayWeight,
      },
      {
        label: "Stock",
        value: displayStock > 0 ? `${displayStock} available` : "Out of stock",
      },
      {
        label: "Brand",
        value: product.brand || "Quick Select",
      },
    ];
  }, [displayWeight, displayStock, product?.brand]);

  const handleAddToCart = async () => {
    const stock = Number(displayStock ?? Infinity);
    if (stock <= 0) {
      showToast("This product is out of stock", "error");
      return;
    }
    const result = await addToCart(variantProduct);
    if (result?.ok === false) {
      showToast(result.error || "Cannot add item to cart", "error");
      return;
    }
    showToast(`${variantProduct.name} added to cart`, "success");
  };

  const handleIncrement = () => {
    const stock = Number(displayStock ?? Infinity);
    if (quantity >= stock) {
      showToast(`Only ${stock} in stock`, "error");
      return;
    }
    updateQuantity(currentVariantId, 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      removeFromCart(currentVariantId);
    } else {
      updateQuantity(currentVariantId, -1);
    }
  };

  if (loadingProduct) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1920px] items-center justify-center px-4 md:px-[50px]">
        <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-6 py-4 shadow-sm">
          <Loader2 className="animate-spin text-[#0c831f]" size={22} />
          <span className="font-bold text-slate-600 dark:text-slate-400">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1920px] flex-col items-center justify-center px-4 text-center md:px-[50px]">
        <h1 className="text-2xl font-black text-foreground">Product not found</h1>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
          {productError || "This product may have been removed or is no longer available."}
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-2xl bg-[#0c831f] px-6 py-3 text-white hover:bg-[#0b721b]"
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1920px] px-4 py-4 pb-24 md:pb-8 md:px-[50px] md:py-8">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <div className="space-y-4 lg:w-[45%] xl:w-[40%]">
          {/* Swipeable Carousel */}
          <div className="relative aspect-square overflow-hidden bg-white dark:bg-background transition-colors group">
            <div 
              ref={detailScrollRef}
              className="w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                if (width > 0) {
                  const newIndex = Math.round(scrollLeft / width);
                  if (newIndex !== currentImgIdx) {
                    setCurrentImgIdx(newIndex);
                  }
                }
              }}
            >
              {product.images.map((image, index) => (
                <div 
                  key={`${image}-${index}`}
                  className="w-full h-full flex-shrink-0 snap-start snap-always flex items-center justify-center cursor-zoom-in"
                  style={{ scrollSnapStop: 'always' }}
                  onClick={() => setIsFullscreenOpen(true)}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
              ))}
            </div>

            {/* Back Button Overlay */}
            <button
              onClick={handleBack}
              className="absolute left-3 top-3 rounded-full p-2.5 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-slate-700 dark:text-white shadow-sm transition-all z-20"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Wishlist Button Overlay */}
            <button
              onClick={handleToggleWishlist}
              className={cn(
                "absolute right-3 top-3 rounded-full p-2.5 shadow-sm transition-all z-20",
                isWishlisted
                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "bg-white/90 dark:bg-black/60 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-black",
              )}
            >
              <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} className={cn(isWishlisted && "fill-current")} />
            </button>

            {/* Dot Indicators */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {product.images.map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      dotIdx === currentImgIdx
                        ? "bg-[#282c3f] dark:bg-white scale-110"
                        : "bg-slate-300 dark:bg-slate-200"
                    )}
                  />
                ))}
              </div>
            )}

            {/* View Details Button Overlay */}
            <button
              onClick={() => setIsDetailsSheetOpen(true)}
              className="absolute bottom-4 right-4 flex items-center gap-1 rounded-md bg-[#eef8f0] px-2.5 py-1.5 shadow-[0_2px_8px_rgba(12,131,31,0.15)] transition-all z-20 text-[11px] font-black text-[#0c831f] hover:bg-[#e1f3e4] border border-[#0c831f]/20"
            >
              View Details <ChevronRight size={14} className="text-[#0c831f]" />
            </button>
          </div>
        </div>

        <div className="space-y-5 lg:w-[55%] xl:w-[60%]">
          <div
            style={{
              opacity: revealSecondary ? 1 : 0,
              transform: revealSecondary ? 'translateY(0px)' : 'translateY(15px)',
              transition: 'opacity 350ms ease-out, transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="space-y-5"
          >
            {/* Delivery time and Rating */}
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-[6px]">
                <Clock size={12} className="text-slate-700 dark:text-slate-300" />
                <span className="text-slate-700 dark:text-slate-300">{product.deliveryTime}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    const avg = Number(averageRating || 4.8);
                    let fillStar = "none";
                    let colorStar = "text-slate-200 dark:text-slate-700";
                    if (avg >= ratingValue) {
                      fillStar = "currentColor";
                      colorStar = "text-[#F5A623] fill-[#F5A623]";
                    } else if (avg > ratingValue - 1) {
                      fillStar = "currentColor";
                      colorStar = "text-[#F5A623] fill-[#F5A623] opacity-60";
                    }
                    return (
                      <Star
                        key={index}
                        size={13}
                        className={colorStar}
                        fill={fillStar}
                      />
                    );
                  })}
                </div>
                <span className="text-slate-500 font-semibold">{reviews.length || 0}</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="text-xl md:text-2xl font-black leading-tight text-[#17212f] dark:text-white transition-colors">
              {product.name}
            </h1>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="pt-2">
                <h3 className="mb-3 text-[13px] font-black text-[#17212f] dark:text-slate-200">
                  Select Unit
                </h3>
                <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?._id ? selectedVariant._id === v._id : (selectedVariant?.name === v.name && selectedVariant?.sku === v.sku);
                    const vPrice = v.salePrice > 0 ? v.salePrice : v.price;
                    const vOriginalPrice = Math.max(vPrice, v.price);
                    const hasDiscount = vOriginalPrice > vPrice;
                    const discountPct = hasDiscount ? Math.round(((vOriginalPrice - vPrice) / vOriginalPrice) * 100) : 0;

                    return (
                      <button
                        key={v.sku}
                        onClick={() => setSelectedVariant(v)}
                        className={cn(
                          "flex flex-col items-start justify-between rounded-xl border p-3 transition-all text-left min-w-[135px] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                          isSelected
                            ? "border-[#0c831f] bg-[#f3faf4] dark:bg-green-950/20 text-[#0c831f] ring-1 ring-[#0c831f]"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#17212f] dark:text-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className={cn("text-[13px] font-black", isSelected ? "text-[#17212f]" : "text-[#17212f] dark:text-slate-200")}>{v.name}</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          {hasDiscount ? (
                            <>
                              <span className="text-[15px] font-black text-[#17212f] dark:text-white">₹{vPrice}</span>
                              <span className="text-[10px] text-slate-400 line-through font-semibold">
                                MRP ₹{vOriginalPrice}
                              </span>
                            </>
                          ) : (
                            <span className="text-[15px] font-black text-[#17212f] dark:text-white">
                              ₹{vPrice}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="mt-1.5 text-[10px] font-black text-[#2b52d9] dark:text-[#5e81f4]">
                            {discountPct}% OFF on MRP
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price section if NO variants exist, handled gracefully to look like variants */}
            {(!product.variants || product.variants.length === 0) && (
              <div className="pt-2">
                <h3 className="mb-3 text-[13px] font-black text-[#17212f] dark:text-slate-200">
                  Select Unit
                </h3>
                <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-none">
                  <div className="flex flex-col items-start justify-between rounded-xl border border-[#0c831f] bg-[#f3faf4] dark:bg-green-950/20 p-3 text-left min-w-[135px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-[#0c831f]">
                    <span className="text-[13px] font-black text-[#17212f]">{displayWeight}</span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[15px] font-black text-[#17212f] dark:text-white">₹{displayPrice}</span>
                      {displayOriginalPrice > displayPrice && (
                        <span className="text-[10px] text-slate-400 line-through font-semibold">
                          MRP ₹{displayOriginalPrice}
                        </span>
                      )}
                    </div>
                    {displayDiscount > 0 && (
                      <span className="mt-1.5 text-[10px] font-black text-[#2b52d9] dark:text-[#5e81f4]">
                        {displayDiscount}% OFF on MRP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seller/Brand Banner */}
            {product.storeName && product.storeName !== "Fresh Mart" && (
              <div 
                onClick={() => {
                  if (product.storeId) {
                    navigate(`/quick/stores/${product.storeId}`);
                  }
                }}
                className="mt-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-[#17212f] dark:text-white">{product.storeName}</span>
                    <span className="text-[12px] font-semibold text-slate-500">View Store Products</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            )}
            
            {/* Guarantee/Policy Banner (Dynamic) */}
            {product.returnPolicy && (
              <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 text-slate-700 dark:text-slate-300">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-[14px] font-bold text-[#17212f] dark:text-white tracking-tight">{product.returnPolicy}</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            )}


            {/* Desktop Add to Cart Bar (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col items-center gap-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:flex-row mt-8 shadow-sm">
              <div className="w-full sm:w-72">
                {quantity > 0 ? (
                  <div className="flex h-[52px] w-full items-center rounded-[12px] bg-[#0c831f] px-2 text-white">
                    <button
                      onClick={handleDecrement}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-black/10"
                    >
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <span className="flex-1 text-center text-[16px] font-black">{quantity}</span>
                    <button
                      disabled={quantity >= Number(displayStock ?? Infinity)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={handleIncrement}
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    className="h-[52px] w-full rounded-[12px] bg-[#0c831f] text-[15px] font-black text-white transition-all hover:bg-[#0b721b]"
                  >
                    Add to cart
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-slate-500 sm:justify-start">
                  <Clock size={14} />
                  Delivered in {product.deliveryTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      {!reviewLoading && reviews.length > 0 && (
        <div 
          style={{
            opacity: revealSecondary ? 1 : 0,
            transform: revealSecondary ? 'translateY(0px)' : 'translateY(15px)',
            transition: 'opacity 350ms ease-out, transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '80ms'
          }}
          className="mt-10 border-t border-border pt-8 max-w-4xl mx-auto w-full"
        >
          <div className="space-y-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-3xl font-black text-foreground">Customer Reviews</h3>
              <div className="flex items-center gap-2 rounded-xl border border-[#0c831f]/10 bg-[#0c831f]/5 px-4 py-2">
                <MessageSquare size={18} className="text-[#0c831f]" />
                <span className="font-black text-[#0c831f]">
                  {reviews.length} Verified
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id || review.id}
                  className="rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-colors"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="ds-h2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-card dark:bg-background border border-border text-slate-400 dark:text-slate-500">
                        {(review.userId?.profileImage || review.userId?.image || review.userAvatar) ? (
                          <img
                            src={resolveQuickImageUrl(review.userId?.profileImage || review.userId?.image || review.userAvatar)}
                            alt={review.userId?.name || review.userName || "Reviewer"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (review.userId?.name || review.userName || "?")[0]
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-foreground transition-colors">
                          {review.userId?.name || review.userName || "Anonymous"}
                        </h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={12}
                              className={cn(
                                index < review.rating
                                  ? "fill-red-400 text-red-400"
                                  : "text-slate-200 dark:text-slate-700",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Similar products section */}
      {!similarLoading && similarProducts.length > 0 && (
        <div 
          style={{
            opacity: revealSecondary ? 1 : 0,
            transform: revealSecondary ? 'translateY(0px)' : 'translateY(15px)',
            transition: 'opacity 350ms ease-out, transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '120ms'
          }}
          className="mt-10 border-t border-border pt-8"
        >
          <h3 className="mb-8 text-2xl font-black text-foreground">
            Similar products
          </h3>

          <div className="flex overflow-x-auto gap-3 pb-2 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
            {similarProducts.slice(0, 5).map((item) => (
              <div key={item.id} className="w-[135px] md:w-[150px] flex-shrink-0 snap-start">
                <ProductCard product={item} compact={true} hideBadge={true} showTimeOnImage={true} />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate(`/quick/product/${product.id}/similar`)}
              className="w-[94%] mx-auto flex items-center justify-center bg-[#F0F4F8] dark:bg-neutral-800/60 border border-slate-200/30 rounded-[14px] py-1 px-4 mt-3 hover:bg-[#E5ECF2] dark:hover:bg-neutral-800 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {/* Overlapping Thumbnails */}
                <div className="flex items-center -space-x-3">
                  {similarProducts.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-9 h-9 rounded-full border-[2.5px] border-white dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center p-0.5 overflow-hidden"
                      style={{ zIndex: 3 - idx }}
                    >
                      <img
                        src={item.image || item.mainImage}
                        alt=""
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[#3B4C69] dark:text-slate-300 font-bold text-[14px] tracking-tight">
                  <span>See all products</span>
                  <ChevronRight size={14} className="text-[#3B4C69] dark:text-slate-300 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Swipeable Gallery Modal */}
      {isFullscreenOpen && typeof window !== "undefined" && (
        <div className="fixed inset-0 z-[99999] bg-[#f8f9fa] dark:bg-neutral-900 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Close Button */}
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="bg-black text-white hover:bg-neutral-800 p-2.5 rounded-full transition-all shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Gallery Area */}
          <div className="flex-1 flex flex-col justify-center max-h-[60vh] relative">
            <div 
              className="fullscreen-scroll-container w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                if (width > 0) {
                  const newIndex = Math.round(scrollLeft / width);
                  if (newIndex !== currentImgIdx) {
                    setCurrentImgIdx(newIndex);
                  }
                }
              }}
              ref={(el) => {
                // When fullscreen opens, scroll to the current active image
                if (el && el.scrollLeft === 0 && currentImgIdx > 0) {
                  const width = el.clientWidth;
                  el.scrollLeft = currentImgIdx * width;
                }
              }}
            >
              {product.images.map((image, index) => (
                <div 
                  key={`fullscreen-${image}-${index}`}
                  className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-4"
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="max-h-[50vh] max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center py-4 overflow-x-auto px-4">
              {product.images.map((image, index) => (
                <button
                  key={`thumb-${image}-${index}`}
                  onClick={() => {
                    setCurrentImgIdx(index);
                    // Scroll the main gallery container to the selected index
                    const container = document.querySelector(".fullscreen-scroll-container");
                    if (container) {
                      container.scrollTo({
                        left: index * container.clientWidth,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={cn(
                    "h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all p-1 bg-white shadow-sm",
                    currentImgIdx === index
                      ? "border-[#0c831f] scale-95"
                      : "border-transparent opacity-70"
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Footer & Page Indicator Container */}
          <div className="mt-auto flex flex-col w-full">
            {/* Footer Area with Price and Cart Button */}
            <div className="bg-white dark:bg-neutral-800 border-t border-slate-100 dark:border-neutral-700 p-5 pb-6">
              <div className="max-w-md mx-auto flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{displayWeight}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">₹{displayPrice}</span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-xs text-slate-400 line-through font-bold">₹{displayOriginalPrice}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">Inclusive of all taxes</p>
                </div>

                {quantity > 0 ? (
                  <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-sm h-10 w-24 justify-between">
                    <button
                      onClick={handleDecrement}
                      className="w-8 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black"
                    >
                      <Minus size={12} strokeWidth={4} />
                    </button>
                    <span className="text-sm font-black min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="w-8 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black"
                    >
                      <Plus size={12} strokeWidth={4} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="bg-[#0c831f] hover:bg-[#0b721b] text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isDetailsSheetOpen && (
        <>
          {/* Fixed Bottom Bar for Mobile/Tablet */}
          <div 
            style={{
              opacity: revealSecondary ? 1 : 0,
              transform: revealSecondary ? 'translateY(0px)' : 'translateY(80px)',
              transition: 'opacity 300ms ease-out, transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c0c14] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between md:hidden"
          >
            <div className="flex flex-col justify-center">
              <span className="text-[12px] font-black text-[#17212f] dark:text-slate-300 leading-none mb-1.5">
                {displayWeight}
              </span>
              <div className="flex items-baseline gap-1.5 leading-none mb-1">
                <span className="text-[16px] font-black text-[#17212f] dark:text-white leading-none">
                  ₹{displayPrice}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <span className="text-[11px] text-slate-400 line-through font-semibold leading-none">
                    MRP ₹{displayOriginalPrice}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none block">
                Inclusive of all taxes
              </span>
            </div>

            <div>
              {quantity > 0 ? (
                <div className="flex h-[42px] w-[110px] items-center justify-between rounded-xl bg-[#318616] px-1 text-white shadow-sm">
                  <button
                    onClick={handleDecrement}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="text-[14px] font-black min-w-[20px] text-center">{quantity}</span>
                  <button
                    disabled={quantity >= Number(displayStock ?? Infinity)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/10 disabled:opacity-40 transition-colors"
                    onClick={handleIncrement}
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="h-[42px] rounded-xl bg-[#318616] px-7 text-[13px] font-black uppercase tracking-tight text-white hover:bg-[#286f12] transition-colors shadow-sm"
                >
                  Add to cart
                </Button>
              )}
            </div>
          </div>

          <MiniCart />
        </>
      )}

      {/* Product Details Bottom Sheet */}
      {isDetailsSheetOpen && typeof window !== "undefined" && (
        <div className="fixed inset-0 z-[999999] flex flex-col justify-end transition-opacity">
          {/* Overlay background */}
          <div 
            className="absolute inset-0 bg-black/60 dark:bg-black/80 animate-in fade-in duration-300"
            onClick={() => setIsDetailsSheetOpen(false)}
          />
          
          {/* Bottom Sheet Content */}
          <div className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-[24px] bg-white dark:bg-[#0c0c14] shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out md:max-h-[70vh] md:w-[500px] md:mx-auto md:mb-10 md:rounded-[24px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-[18px] font-black text-[#17212f] dark:text-white">Product Details</h3>
              <button
                onClick={() => setIsDetailsSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Scrollable Details */}
            <div className="flex-1 overflow-y-auto px-6 pb-12 scrollbar-none">
              <div className="flex flex-col">
                <div className="py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <h4 className="text-[12px] font-bold text-slate-500 mb-1.5">Description</h4>
                  <p className="text-[14px] font-medium text-[#17212f] dark:text-slate-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
                
                {displayDetails.filter(d => d.label !== "Description").map((detail, idx) => (
                  <div key={idx} className="py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <h4 className="text-[12px] font-bold text-slate-500 mb-1.5">{detail.label}</h4>
                    <p className="text-[14px] font-medium text-[#17212f] dark:text-slate-300">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
