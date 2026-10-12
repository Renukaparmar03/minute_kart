import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, MapPin, Phone, 
  ChevronDown, ChevronUp, Package, 
  Navigation, CheckCircle2, Camera, Loader2, Image as ImageIcon
} from 'lucide-react';
import { ActionSlider } from '@/modules/DeliveryV2/components/ui/ActionSlider';
import { uploadAPI } from '@food/api';
import { toast } from 'sonner';
import { openCamera } from "@food/utils/imageUploadUtils";
import { normalizePickupPoints, isMixedOrder } from '@/modules/DeliveryV2/utils/orderRouting';
const getItemImage = (item) => {
  if (!item) return null;
  return (
    item.image ||
    item.img ||
    item.imageUrl ||
    item.imagePath ||
    item.thumbnail ||
    item.photo ||
    item.itemImage ||
    (typeof item.productId === 'object' ? (
      item.productId?.image ||
      item.productId?.images?.[0] ||
      item.productId?.thumbnail ||
      item.productId?.imageUrl
    ) : null) ||
    null
  );
};

const getItemWeightOrVariant = (item) => {
  if (!item) return '';
  const parts = [];
  
  const w = item.weight || (typeof item.productId === 'object' ? item.productId?.weight : null);
  const u = item.unit || (typeof item.productId === 'object' ? item.productId?.unit : null);
  
  if (w) parts.push(String(w).trim());
  if (u && (!w || !String(w).toLowerCase().includes(String(u).toLowerCase()))) {
    parts.push(String(u).trim());
  }

  const variant = item.variantName || item.variant || item.selectedVariant?.name || item.quantityDescription || item.packSize || item.size || item.volume;
  if (variant && !parts.includes(String(variant).trim())) {
    parts.push(String(variant).trim());
  }

  if (parts.length > 0) {
    return Array.from(new Set(parts)).join(' • ');
  }
  return item.description || '';
};

const getItemPrice = (item) => {
  if (!item) return null;
  const p = item.price ?? item.itemPrice ?? item.amount ?? item.priceAtPurchase ?? item.totalPrice;
  if (p !== undefined && p !== null && !isNaN(Number(p)) && Number(p) > 0) {
    return `₹${Number(p).toFixed(0)}`;
  }
  return null;
};

/**
 * PickupActionModal - Unified White/Green Theme with Slider Actions.
 * Includes Bill Upload feature prior to pickup.
 */
export const PickupActionModal = ({ 
  order, 
  status, 
  isWithinRange, 
  distanceToTarget,
  eta,
  onReachedPickup, 
  onPickedUp,
  onMinimize
}) => {
  const [showItems, setShowItems] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [billImageUploaded, setBillImageUploaded] = useState(false);
  const [billImageUrl, setBillImageUrl] = useState(null);
  const cameraInputRef = useRef(null);

  if (!order) return null;

  const handleBillImageSelect = async (file) => {
    if (!file) return;

    setIsUploadingBill(true);
    try {
      let finalFile = file;
      if (file.type.startsWith('image/')) {
        const { compressImage } = await import('@/shared/utils/imageCompression');
        finalFile = await compressImage(file, { 
          maxSizeMB: 0.2, // 200KB max for bills
          maxWidthOrHeight: 1000,
          fileType: 'image/webp'
        });
      }

      if (finalFile.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        setIsUploadingBill(false);
        return;
      }

      const res = await uploadAPI.uploadMedia(finalFile, { folder: 'appzeto/delivery/bills' });
      if (res?.data?.success && res?.data?.data) {
        setBillImageUrl(res.data.data.url || res.data.data.secure_url);
        setBillImageUploaded(true);
        // toast.success('Bill image uploaded!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      toast.error('Failed to upload bill image');
      setBillImageUploaded(false);
      setBillImageUrl(null);
    } finally {
      setIsUploadingBill(false);
    }
  };

  const handleTakeCameraPhoto = () => {
    openCamera({
      onSelectFile: (file) => handleBillImageSelect(file),
      fileNamePrefix: `bill-${order.orderId || order._id}`
    })
  }

  const handlePickFromGallery = () => {
    cameraInputRef.current?.click()
  }

  const isAtPickup = status === 'REACHED_PICKUP';
  const isQuickOrder = String(order?.orderType || order?.serviceType || order?.type || '').trim().toLowerCase() === 'quick';
  const restaurantName = isQuickOrder
    ? order?.storeName || order?.sellerName || order?.seller?.shopName || order?.seller?.name || 'Seller store'
    : order?.restaurantName || order?.restaurant_name || order?.restaurantId?.restaurantName || order?.restaurantId?.name || 'Restaurant';
  const restaurantAddress = isQuickOrder
    ? order?.storeAddress || order?.sellerAddress || order?.seller?.location?.address || order?.seller?.location?.formattedAddress || 'Address not available'
    : order?.restaurantAddress || order?.restaurant_address || order?.restaurantLocation?.address || 'Address not available';
  const restaurantPhone = isQuickOrder
    ? order?.storePhone || order?.sellerPhone || order?.seller?.phone || ''
    : order?.restaurantPhone || order?.restaurant_phone || order?.restaurantId?.phone || '';
  const items = order.items || [];
  const restaurantLogo = isQuickOrder
    ? order?.storeImage || order?.seller?.logo || order?.seller?.image || order?.seller?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'
    : order?.restaurantImage || order?.restaurant?.logo || order?.restaurant?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png';
  const pickupPoints = normalizePickupPoints(order);
  const mixedOrder = isMixedOrder(order);
  const pickupStops = pickupPoints.length
    ? pickupPoints
    : [
        {
          id: 'food:primary',
          pickupType: isQuickOrder ? 'quick' : 'food',
          sourceName: restaurantName,
          address: restaurantAddress,
          phone: restaurantPhone,
        },
      ];
  const primaryStop = pickupStops[0] || null;
  const primaryPickupType = primaryStop?.pickupType === 'quick' ? 'quick' : 'food';
  const primaryName = primaryStop?.sourceName || restaurantName;
  const primaryAddress = primaryStop?.address || restaurantAddress;
  const primaryPhone = primaryStop?.phone || restaurantPhone;
  const primaryDestinationLabel = primaryPickupType === 'quick' ? 'Store' : 'Restaurant';

  return (
    <div className="absolute inset-x-0 bottom-0 z-[110] p-0 sm:p-2 sm:mb-2 flex items-end justify-center">
      {/* Background Dim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onMinimize}
        className="absolute inset-0 bg-black/40 -z-10"
      />

      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.2)] p-3.5 pb-4 max-h-[82vh] overflow-y-auto"
      >
        {/* Handle / Minimize */}
        <div className="w-full flex justify-center pb-2 pt-0.5">
          <button onClick={onMinimize} className="p-1 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex flex-col items-center">
             <ChevronDown className="w-5 h-5 text-gray-400 stroke-[2.5]" />
          </button>
        </div>

        {/* Restaurant Header */}
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xs overflow-hidden border border-gray-100 shrink-0">
              <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-gray-950 text-base font-bold truncate leading-tight">{primaryName}</h3>
              {mixedOrder && (
                <div className="mt-0.5 inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-600">
                  Mixed Order
                </div>
              )}
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                {isAtPickup ? (
                  <span className="text-[#86bf24]">Reached Location ✓</span>
                ) : (
                  <span className="text-orange-500 truncate">
                    {(distanceToTarget / 1000).toFixed(1)} km • {eta || '--'} min to {primaryDestinationLabel}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0 ml-2">
            {primaryPhone && (
              <button
                onClick={() => window.location.href = `tel:${primaryPhone}`}
                className="w-8 h-8 rounded-full bg-[#f3f9e8] flex items-center justify-center text-[#86bf24] border border-[#e6f4cf] active:scale-95 transition-transform"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryAddress)}`, '_blank')}
              className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
              title="Navigate"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-2.5 space-y-1.5">
          {pickupStops.map((pickup, index) => {
            const isQuickStore = pickup.pickupType === 'quick';
            const label = isQuickStore ? 'Store Pickup' : 'Restaurant Pickup';
            const accentClasses = isQuickStore
              ? 'text-orange-600 bg-orange-50 border-orange-100'
              : 'text-[#86bf24] bg-[#f3f9e8] border-[#e6f4cf]';

            return (
              <div
                key={pickup.id || `${pickup.pickupType}-${index}`}
                className="rounded-xl border border-gray-100 bg-gray-50/80 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${accentClasses}`}>
                    <MapPin className="w-3 h-3" />
                    <span>{pickupStops.length > 1 ? `${label} ${index + 1}` : label}</span>
                  </div>
                  {pickupStops.length > 1 && (
                    <span className="text-[11px] font-bold text-gray-700 truncate">{pickup.sourceName}</span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium leading-snug text-gray-500 line-clamp-2">{pickup.address || 'Address not available'}</p>
              </div>
            );
          })}
        </div>

        {/* Action Sliders */}
        <div className="space-y-2.5">
          {!isAtPickup ? (
            <div>
              <p className={`text-center text-[9px] font-bold uppercase tracking-wider mb-1.5 transition-colors ${
                isWithinRange ? 'text-[#86bf24]' : 'text-orange-500 animate-pulse'
              }`}>
                {isWithinRange ? 'Ready - Swipe to confirm arrival' : 'Get closer to pickup point'}
              </p>
              <ActionSlider 
                key="action-reach"
                label="Slide to Reach" 
                successLabel="Reached!"
                disabled={!isWithinRange}
                onConfirm={onReachedPickup}
                color="bg-[#86bf24]"
                size="compact"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-center items-center gap-2.5 w-full">
                 {!billImageUploaded && !isUploadingBill && (
                   <>
                      <button
                        onClick={handleTakeCameraPhoto}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>
                      <button
                        onClick={handlePickFromGallery}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Gallery</span>
                      </button>
                   </>
                 )}

                 {isUploadingBill && (
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-400 font-bold text-xs uppercase tracking-wider">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span>Uploading...</span>
                    </div>
                 )}

                 {billImageUploaded && (
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#e6f4cf] text-[#66941a] font-bold text-xs uppercase tracking-wider">
                       <CheckCircle2 className="w-4 h-4" />
                       <span>Bill Uploaded</span>
                    </div>
                 )}

                 <input
                   ref={cameraInputRef}
                   type="file"
                   accept="image/*"
                   onChange={(e) => handleBillImageSelect(e.target.files[0])}
                   className="hidden"
                 />
              </div>

              <div>
                <p className={`text-center text-[9px] font-bold uppercase tracking-wider mb-1.5 ${billImageUploaded ? 'text-[#86bf24]' : 'text-gray-400'}`}>
                  {billImageUploaded ? "Check the restaurant logo - Swipe to pick up" : "Capture bill to unlock swipe"}
                </p>
                <ActionSlider 
                  key="action-pickup"
                  label="Slide to Pick Up" 
                  successLabel="Picked Up!"
                  disabled={!billImageUploaded}
                  onConfirm={() => onPickedUp(billImageUrl)}
                  color="bg-orange-500"
                  size="compact"
                />
              </div>
            </div>
          )}

          {/* Delivery Instructions (User Note) */}
          {order?.note && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 flex gap-2.5 items-center">
              <ChefHat className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mr-1.5">User Instructions:</span>
                <span className="text-xs font-bold text-gray-800">"{order.note}"</span>
              </div>
            </div>
          )}

          {/* Collapsible Order Summary */}
          <button 
            onClick={() => setShowItems(!showItems)}
            className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
              <Package className="w-4 h-4 text-gray-400" />
              <span>Order Details ({items.length || 0})</span>
            </div>
            {showItems ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {showItems && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 px-0.5 pt-1">
              {items.map((item, idx) => {
                const itemImg = getItemImage(item);
                const itemWeight = getItemWeightOrVariant(item);
                const itemPrice = getItemPrice(item);
                const itemName = item.name || item.title || item.productName || (typeof item.productId === 'object' ? item.productId?.name : '') || 'Item Name';
                const itemQty = item.quantity || item.qty || item.count || 1;

                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 bg-gray-50/90 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition-all gap-2.5"
                  >
                    {/* Item Image & Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        {itemImg ? (
                          <img 
                            src={itemImg} 
                            alt={itemName} 
                            className="w-full h-full object-contain rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full items-center justify-center text-gray-400 ${itemImg ? 'hidden' : 'flex'}`}>
                          <Package className="w-4 h-4 text-gray-400 stroke-[1.5]" />
                        </div>
                      </div>

                      {/* Name, weight/variant & price */}
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-900 text-xs font-bold truncate leading-tight">
                          {itemName}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {itemWeight ? (
                            <span className="text-[9px] font-semibold text-gray-600 bg-white border border-gray-200/80 px-1 py-0.2 rounded leading-none">
                              {itemWeight}
                            </span>
                          ) : null}
                          {itemPrice ? (
                            <span className="text-[10px] font-bold text-gray-700">
                              {itemPrice}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Badge */}
                    <div className="shrink-0">
                      <span className="text-[#86bf24] font-bold bg-[#f3f9e8] border border-[#e6f4cf] px-2 py-0.5 rounded-lg text-[11px] flex items-center justify-center">
                        x{itemQty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default PickupActionModal;
