import React, { memo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDownUp, Utensils } from "lucide-react";
import { CategoryChipRowSkeleton } from "@food/components/ui/loading-skeletons";
import OptimizedImage from "@food/components/OptimizedImage";
import { FOOD_VEG_COLOR } from "@food/constants/theme";
import allIcon from "@/assets/c0a633fa42582f2a3752d4341dcfa5a2-removebg-preview.png";

const CategoryRail = memo(({ 
  displayCategories, 
  showCategorySkeleton,
  navigate,
  backendOrigin = "",
  selectedCategory = "all",
  setSelectedCategory
}) => {
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const rail = categoryScrollRef.current;
      if (!rail) return;

      const selectedButton = rail.querySelector("[data-category-selected='true']");
      if (!selectedButton || typeof selectedButton.scrollIntoView !== "function") return;

      selectedButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCategory, displayCategories]);

  const dbAllCategory = displayCategories?.find(
    (cat) => cat.name?.trim().toLowerCase() === "all" || cat.slug?.trim().toLowerCase() === "all"
  );

  const filteredCategories = displayCategories?.filter(
    (cat) => cat.name?.trim().toLowerCase() !== "all" && cat.slug?.trim().toLowerCase() !== "all"
  ) || [];

  const resolveCatImage = (raw) => {
    if (!raw) return "";
    if (/^(https?:|\/\/|data:|blob:)/i.test(raw.trim())) return raw;
    return backendOrigin
      ? `${backendOrigin.replace(/\/$/, "")}${raw.startsWith("/") ? raw : `/${raw}`}`
      : raw;
  };

  const allIconToUse = dbAllCategory?.image ? resolveCatImage(dbAllCategory.image) : allIcon;
  const allNameToUse = dbAllCategory?.name || "All";

  return (
    <section className="px-4 py-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        What's on your mind?
      </h2>
      
      <div 
        ref={categoryScrollRef}
        className="flex gap-4 overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div 
          className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group perspective-[1000px]"
          onClick={() => navigate("/user/under-250")}
        >
          <style>
            {`
              @keyframes pop-bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
              }
              @keyframes confetti-burst {
                0% {
                  box-shadow: 
                    0 0 0 0 #ff0a54, 0 0 0 0 #ff477e, 0 0 0 0 #ff7096, 
                    0 0 0 0 #ff85a1, 0 0 0 0 #fbb1bd, 0 0 0 0 #f9bec7;
                  opacity: 1;
                }
                100% {
                  box-shadow: 
                    -35px -35px 0 2px #ff0a54, 35px -35px 0 1px #ff477e, -40px 20px 0 2px #ff7096, 
                    40px 25px 0 1px #ff85a1, 0px -45px 0 2px #fbb1bd, 0px 45px 0 1px #f9bec7;
                  opacity: 0;
                }
              }
              .party-popper-btn {
                animation: pop-bounce 3s infinite ease-in-out;
                position: relative;
              }
              .party-popper-btn::before, .party-popper-btn::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: -1;
                animation: confetti-burst 1.5s infinite ease-out;
              }
              .party-popper-btn::after {
                animation-delay: 0.75s;
                width: 4px;
                height: 4px;
                animation-name: confetti-burst-alt;
              }
              @keyframes confetti-burst-alt {
                0% {
                  box-shadow: 
                    0 0 0 0 #ffba08, 0 0 0 0 #faa307, 0 0 0 0 #f48c06, 
                    0 0 0 0 #e85d04, 0 0 0 0 #dc2f02, 0 0 0 0 #d00000;
                  opacity: 1;
                }
                100% {
                  box-shadow: 
                    30px 25px 0 1px #ffba08, -30px -30px 0 2px #faa307, 25px -40px 0 1px #f48c06, 
                    -35px 35px 0 2px #e85d04, 45px 0px 0 1px #dc2f02, -45px 0px 0 2px #d00000;
                  opacity: 0;
                }
              }
              @keyframes zomato-flip {
                0%, 35% { transform: rotateY(0deg); }
                50%, 85% { transform: rotateY(180deg); }
                100% { transform: rotateY(360deg); }
              }
              .zomato-flip-container {
                transform-style: preserve-3d;
                animation: zomato-flip 6s infinite cubic-bezier(0.4, 0, 0.2, 1);
                width: 100%;
                height: 100%;
                position: relative;
                border-radius: 9999px;
              }
              .zomato-flip-face {
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                border-radius: 9999px;
              }
              .zomato-flip-back {
                transform: rotateY(180deg);
              }
            `}
          </style>
          
          {/* Outer container for confetti and bounce */}
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-full shadow-[0_4px_12px_rgba(233,30,99,0.35)] transition-transform group-active:scale-95 party-popper-btn z-10 p-0 border-2 border-white bg-white">
            
            {/* Inner container for 3D flip */}
            <div className="zomato-flip-container">
              {/* Front Face */}
              <div 
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-1 zomato-flip-face"
                style={{ background: "linear-gradient(135deg, #FF3366 0%, #E91E63 100%)", boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.15)" }}
              >
                <span className="text-[10px] font-extrabold text-pink-100 tracking-wide leading-none mt-1 uppercase">Under</span>
                <span className="text-[17px] sm:text-[20px] font-black text-white leading-tight drop-shadow-sm mt-0.5">₹200</span>
              </div>

              {/* Back Face */}
              <div 
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-1 zomato-flip-face zomato-flip-back"
                style={{ background: "linear-gradient(135deg, #448DF9 0%, #1D4ED8 100%)", boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.15)" }}
              >
                <span className="text-[10px] font-extrabold text-blue-100 uppercase mb-0.5 leading-none mt-0.5">Top</span>
                <span className="text-[15px] sm:text-[17px] font-black text-white leading-none drop-shadow-sm uppercase">Offers</span>
              </div>
            </div>

          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Offers</span>
        </div>

        {/* All section */}
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          data-category-selected={selectedCategory === "all" ? "true" : "false"}
          className={`flex-shrink-0 flex flex-col items-center gap-2 group pb-1.5 transition-all outline-none border-b-2 ${
            selectedCategory === "all" ? "border-[#DC021B]" : "border-transparent"
          }`}
        >
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
            <img
              src={allIconToUse}
              alt={allNameToUse}
              className="w-full h-full object-contain"
            />
          </div>
          <span className={`text-xs font-semibold truncate w-full text-center transition-colors ${
            selectedCategory === "all" ? "text-[#DC021B] dark:text-[#DC021B]" : "text-gray-600 dark:text-gray-300"
          }`}>
            {allNameToUse}
          </span>
        </button>

        {!showCategorySkeleton && filteredCategories.map((category, index) => {
          const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, "-");
          const isSelected = selectedCategory === categorySlug;
          const categoryImg = resolveCatImage(category.image);
          return (
            <button
              key={category.id || index}
              type="button"
              onClick={() => setSelectedCategory(categorySlug)}
              data-category-selected={isSelected ? "true" : "false"}
              className={`flex-shrink-0 flex flex-col items-center gap-2 group pb-1.5 transition-all outline-none border-b-2 ${
                isSelected ? "border-[#DC021B]" : "border-transparent"
              }`}
            >
              <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
                {categoryImg ? (
                  <img
                    src={categoryImg}
                    alt={category.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {String(category.name || "?").trim().slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-xs font-semibold truncate w-full text-center transition-colors ${
                isSelected ? "text-[#DC021B] dark:text-[#DC021B]" : "text-gray-600 dark:text-gray-300"
              }`}>
                {category.name}
              </span>
            </button>
          );
        })}

        {showCategorySkeleton && <CategoryChipRowSkeleton className="flex-shrink-0" />}

        {/* See All link at the end */}
        <Link
          to={`/user/category/${selectedCategory || 'all'}`}
          className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
        >
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-full transition-transform group-hover:scale-110 flex items-center justify-center bg-[#FFF0F1] dark:bg-red-950/30">
            <Utensils className="h-6 w-6 text-[#ef4f5f] dark:text-red-450" />
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-0.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              See all
            </span>
            <span className="text-[8px] text-[#ef4f5f] dark:text-red-450 select-none">▼</span>
          </div>
        </Link>
      </div>
    </section>
  );
});

export default CategoryRail;
