import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import OptimizedImage from "@food/components/OptimizedImage";

const PopularRestaurantSection = memo(({ popularRestaurants, backendOrigin = "" }) => {
  if (!popularRestaurants || popularRestaurants.length === 0) return null;

  return (
    <motion.section
      className="content-auto pt-1 pb-4 px-4 bg-white dark:bg-[#0a0a0a]"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex items-center gap-1.5">
        <style>
          {`
            @keyframes text-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            .animate-text-shimmer {
              background: linear-gradient(
                90deg, 
                var(--color-foreground) 0%, 
                #ef4444 25%, 
                var(--color-foreground) 50%
              );
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
              animation: text-shimmer 4s ease-in-out infinite;
            }
            .dark .animate-text-shimmer {
              background: linear-gradient(
                90deg, 
                #f3f4f6 0%, 
                #f87171 25%, 
                #f3f4f6 50%
              );
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
            }
          `}
        </style>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight animate-text-shimmer">
          Top 10 Popular Restaurants
        </h2>
        <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {popularRestaurants.map((restaurant, index) => {
          const restaurantSlug =
            restaurant.slug ||
            restaurant.restaurantName?.toLowerCase().replace(/\s+/g, "-") ||
            restaurant.name?.toLowerCase().replace(/\s+/g, "-") ||
            "restaurant";
          
          const availabilityStatus = getRestaurantAvailabilityStatus(restaurant, new Date());
          const isOffline = !availabilityStatus.isOpen;
          
          // Estimated delivery time
          const deliveryTime = restaurant.deliveryTime || restaurant.estimatedDeliveryTime || "15-20 mins";
 
          // Restaurant image
          const rawImg = restaurant.image ||
                         restaurant.profileImage?.url || 
                         restaurant.profileImage || 
                         (restaurant.coverImages && restaurant.coverImages.length > 0 ? restaurant.coverImages[0]?.url || restaurant.coverImages[0] : "") || 
                         "";
          const cleanRaw = typeof rawImg === "string" ? rawImg.trim().replace(/\/api(?:\/v\d+)?\/uploads\//i, "/uploads/") : "";
          const cleanOrigin = backendOrigin ? backendOrigin.replace(/\/api(?:\/v\d+)?\/?$/i, "").replace(/\/$/, "") : "";
          const restaurantImage = cleanRaw
            ? (/^(https?:|\/\/|data:|blob:)/i.test(cleanRaw)
                ? cleanRaw
                : cleanOrigin
                  ? `${cleanOrigin}${cleanRaw.startsWith("/") ? cleanRaw : `/${cleanRaw}`}`
                  : cleanRaw)
            : "";
 
          return (
            <motion.div
              key={`popular-${restaurant.mongoId || restaurant.id || restaurant._id || restaurantSlug}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex-shrink-0 w-[86px] sm:w-[96px] flex flex-col items-center gap-1 group text-center"
            >
              <Link
                to={isOffline ? "#" : `/user/restaurants/${restaurantSlug}`}
                onClick={(e) => isOffline && e.preventDefault()}
                className="relative block"
              >
                <div className={`w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full p-[2.5px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 overflow-hidden ${isOffline ? "grayscale opacity-75" : ""}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800 flex items-center justify-center">
                    {restaurantImage ? (
                      <img
                        src={restaurantImage}
                        alt={restaurant.restaurantName || restaurant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
                        {(restaurant.restaurantName || restaurant.name || 'R').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              
              <div className="flex flex-col gap-0.5 mt-1.5 w-full">
                <span className="text-xs font-extrabold text-gray-800 dark:text-neutral-200 truncate px-0.5 leading-tight group-hover:text-red-500 transition-colors">
                  {restaurant.restaurantName || restaurant.name}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
                  {deliveryTime}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});

PopularRestaurantSection.displayName = "PopularRestaurantSection";

export default PopularRestaurantSection;
