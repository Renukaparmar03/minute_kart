import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { customerApi } from "../services/customerApi";
import { Sparkles } from "lucide-react";

// MUI Icons (shared with admin & icon selector)
import HomeIcon from "@mui/icons-material/Home";
import DevicesIcon from "@mui/icons-material/Devices";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PetsIcon from "@mui/icons-material/Pets";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SpaIcon from "@mui/icons-material/Spa";
import ToysIcon from "@mui/icons-material/Toys";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import YardIcon from "@mui/icons-material/Yard";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import DiamondIcon from "@mui/icons-material/Diamond";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BuildIcon from "@mui/icons-material/Build";
import LuggageIcon from "@mui/icons-material/Luggage";

import { resolveQuickImageUrl, QUICK_IMAGE_FALLBACK, handleQuickImageError } from "../utils/image";

// --- Constants ---
const DEFAULT_CATEGORY_THEME = {
  gradient: "linear-gradient(to bottom, #25D366, #4ADE80)",
  shadow: "shadow-green-500/20",
  accent: "text-[#1A1A1A]",
};

const CATEGORY_METADATA = {
  All: {
    icon: HomeIcon,
    theme: DEFAULT_CATEGORY_THEME,
    banner: { title: "HOUSEFULL", subtitle: "SALE", floatingElements: "sparkles" },
  },
  Grocery: {
    icon: LocalGroceryStoreIcon,
    theme: { gradient: "linear-gradient(to bottom, #FF9F1C, #FFBF69)", shadow: "shadow-orange-500/20", accent: "text-orange-900" },
    banner: { title: "SUPERSAVER", subtitle: "FRESH & FAST", floatingElements: "leaves" },
  },
  Wedding: {
    icon: CardGiftcardIcon,
    theme: { gradient: "linear-gradient(to bottom, #FF4D6D, #FF8FA3)", shadow: "shadow-rose-500/20", accent: "text-rose-900" },
    banner: { title: "WEDDING", subtitle: "BLISS", floatingElements: "hearts" },
  },
  "Home & Kitchen": {
    icon: KitchenIcon,
    theme: { gradient: "linear-gradient(to bottom, #BC6C25, #DDA15E)", shadow: "shadow-amber-500/20", accent: "text-amber-900" },
    banner: { title: "HOME", subtitle: "KITCHEN", floatingElements: "smoke" },
  },
  Electronics: {
    icon: DevicesIcon,
    theme: { gradient: "linear-gradient(to bottom, #7209B7, #B5179E)", shadow: "shadow-purple-500/20", accent: "text-purple-900" },
    banner: { title: "TECH FEST", subtitle: "GADGETS", floatingElements: "tech" },
  },
  Kids: {
    icon: ChildCareIcon,
    theme: { gradient: "linear-gradient(to bottom, #4CC9F0, #A0E7E5)", shadow: "shadow-blue-500/20", accent: "text-blue-900" },
    banner: { title: "LITTLE ONE", subtitle: "CARE", floatingElements: "bubbles" },
  },
  "Pet Supplies": {
    icon: PetsIcon,
    theme: { gradient: "linear-gradient(to bottom, #FB8500, #FFB703)", shadow: "shadow-yellow-500/20", accent: "text-yellow-900" },
    banner: { title: "PAWSOME", subtitle: "DEALS", floatingElements: "bones" },
  },
  Sports: {
    icon: SportsSoccerIcon,
    theme: { gradient: "linear-gradient(to bottom, #4361EE, #4895EF)", shadow: "shadow-indigo-500/20", accent: "text-indigo-900" },
    banner: { title: "SPORTS", subtitle: "GEAR", floatingElements: "confetti" },
  },
};

const ICON_COMPONENTS = {
  electronics: DevicesIcon,
  fashion: CheckroomIcon,
  home: HomeIcon,
  food: LocalCafeIcon,
  sports: SportsSoccerIcon,
  books: MenuBookIcon,
  beauty: SpaIcon,
  toys: ToysIcon,
  automotive: DirectionsCarIcon,
  pets: PetsIcon,
  health: LocalHospitalIcon,
  garden: YardIcon,
  office: BusinessCenterIcon,
  music: MusicNoteIcon,
  jewelry: DiamondIcon,
  baby: ChildCareIcon,
  tools: BuildIcon,
  luggage: LuggageIcon,
  art: ColorLensIcon,
  grocery: LocalGroceryStoreIcon,
};

const ALL_CATEGORY = {
  id: "all",
  _id: "all",
  name: "All",
  icon: HomeIcon,
  theme: DEFAULT_CATEGORY_THEME,
  headerColor: "#065f46",
  banner: {
    title: "HOUSEFULL",
    subtitle: "SALE",
    floatingElements: "sparkles",
    textColor: "text-white",
  },
};

const QUICK_HEADER_RETURN_STORAGE_KEY = "food.quick.headerReturn";

// --- Global Persistence Cache ---
let globalQuickHomeCache = {
  data: null,
  headerSections: new Map(), // headerId -> sections
  categoryProducts: new Map(), // headerId -> products
  lastFetched: 0,
};

const CACHE_EXPIRY_MS = 5 * 1000; // 5 seconds
const FETCH_DEBOUNCE_MS = 200;

// Retry transient failures (cold start, network blip) so the user never has to refresh by hand.
const withRetry = async (fn, attempts = 3) => {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 600 * (i + 1)));
    }
  }
  throw lastError;
};

// ~11m precision: GPS jitter must not trigger a refetch that throws away in-flight results.
const buildLocationKey = (location) => {
  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);
  const zone = location?.zoneId || location?.zone?._id || "";
  return `${Number.isFinite(lat) ? lat.toFixed(4) : "x"}_${Number.isFinite(lng) ? lng.toFixed(4) : "x"}_${zone}`;
};

export const useQuickHomeData = ({ currentLocation }) => {
  const hasValidCache = globalQuickHomeCache.data && (Date.now() - globalQuickHomeCache.lastFetched < CACHE_EXPIRY_MS);
  
  const [isLoading, setIsLoading] = useState(!hasValidCache);
  const [isBootstrapped, setIsBootstrapped] = useState(hasValidCache);
  const [categories, setCategories] = useState(globalQuickHomeCache.data?.categories || [ALL_CATEGORY]);
  const [activeCategory, setActiveCategory] = useState(globalQuickHomeCache.data?.activeCategory || ALL_CATEGORY);
  const [products, setProducts] = useState(globalQuickHomeCache.data?.products || []);
  const [quickCategories, setQuickCategories] = useState(globalQuickHomeCache.data?.quickCategories || []);
  const [experienceSections, setExperienceSections] = useState(globalQuickHomeCache.data?.experienceSections || []);
  const [offerSections, setOfferSections] = useState(globalQuickHomeCache.data?.offerSections || []);
  const [bestSellerSections, setBestSellerSections] = useState(globalQuickHomeCache.data?.bestSellerSections || []);
  const [categoryMap, setCategoryMap] = useState(globalQuickHomeCache.data?.categoryMap || {});
  const [subcategoryMap, setSubcategoryMap] = useState(globalQuickHomeCache.data?.subcategoryMap || {});
  const [heroConfig, setHeroConfig] = useState(globalQuickHomeCache.data?.heroConfig || { banners: { items: [] }, categoryIds: [] });
  const [headerSections, setHeaderSections] = useState([]);
  const [loadingHeaderSections, setLoadingHeaderSections] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState(null); // null = use global products

  const fetchDataSeqRef = useRef(0);
  // fetchData reads the latest location from here so it only re-runs when the (rounded) key changes.
  const locationRef = useRef(currentLocation);
  locationRef.current = currentLocation;
  const locationKey = buildLocationKey(currentLocation);

  // Persist activeCategory selection in sessionStorage and global cache
  useEffect(() => {
    if (!activeCategory || !isBootstrapped) return;
    
    // 1. Update sessionStorage
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        QUICK_HEADER_RETURN_STORAGE_KEY,
        JSON.stringify({
          headerId: activeCategory._id || activeCategory.id || "all",
          color: activeCategory.headerColor || null,
          name: activeCategory.name || "All",
        })
      );
    }

    // 2. Update global cache
    if (globalQuickHomeCache.data) {
      globalQuickHomeCache.data.activeCategory = activeCategory;
    }
  }, [activeCategory, isBootstrapped]);

  const getQuickCategoryImage = useCallback((category = {}) => {
    const candidate = category?.image || category?.icon || category?.thumbnail || category?.imageUrl || category?.iconUrl || category?.media?.image || category?.media?.url || "";
    return resolveQuickImageUrl(candidate) || QUICK_IMAGE_FALLBACK;
  }, []);

  const fetchData = useCallback(async () => {
    const seq = ++fetchDataSeqRef.current;
    const currentLocation = locationRef.current;
    const currentLocationKey = locationKey;
    
    // Use cache if strictly valid and location key matches
    if (globalQuickHomeCache.data && globalQuickHomeCache.locationKey === currentLocationKey && (Date.now() - globalQuickHomeCache.lastFetched < CACHE_EXPIRY_MS)) {
       setIsLoading(false);
       setIsBootstrapped(true);
       return;
    }

    setIsLoading(true);
    try {
      const hasValidLocation = Number.isFinite(currentLocation?.latitude) && Number.isFinite(currentLocation?.longitude);
      const productParams = { limit: 50 };
      if (hasValidLocation) {
        productParams.lat = currentLocation.latitude;
        productParams.lng = currentLocation.longitude;
      }
      const zoneId = currentLocation?.zoneId || currentLocation?.zone?._id || currentLocation?.zoneIdStr;
      if (zoneId) {
        productParams.zoneId = zoneId;
      }

      // Initialize cache object
      const newDataCache = {
        categories: [ALL_CATEGORY],
        activeCategory: ALL_CATEGORY,
        products: [],
        quickCategories: [],
        experienceSections: [],
        offerSections: [],
        bestSellerSections: [],
        heroConfig: { banners: { items: [] }, categoryIds: [] },
        categoryMap: {},
        subcategoryMap: {},
      };

      let pendingTasks = 6;
      let hadFailure = false;
      const markFailed = (error) => {
        hadFailure = true;
        console.error(error);
      };
      const checkDone = () => {
        pendingTasks--;
        if (pendingTasks <= 0 && seq === fetchDataSeqRef.current) {
          // Never cache a partial/failed load, otherwise a remount would show it as fresh data.
          if (!hadFailure) {
            globalQuickHomeCache.data = newDataCache;
            globalQuickHomeCache.locationKey = currentLocationKey;
            globalQuickHomeCache.lastFetched = Date.now();
          }
          setIsLoading(false);
          setIsBootstrapped(true);
        }
      };

      // 1. Categories (Fastest, unblocks header)
      withRetry(() => customerApi.getCategories()).then(catRes => {
        if (seq !== fetchDataSeqRef.current) return;
        if (catRes?.data?.success) {
          const dbCats = catRes.data.results || catRes.data.result || [];
          const catMap = {};
          const subMap = {};
          dbCats.forEach((c) => {
            if (c.type === "category") catMap[c._id] = c;
            else if (c.type === "subcategory") subMap[c._id] = c;
          });
          setCategoryMap(catMap);
          setSubcategoryMap(subMap);
          newDataCache.categoryMap = catMap;
          newDataCache.subcategoryMap = subMap;

          const formattedHeaders = dbCats.filter((cat) => cat.type === "category").map((cat) => {
            const catName = cat.name;
            const meta = CATEGORY_METADATA[catName] || CATEGORY_METADATA[catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase()] || CATEGORY_METADATA[catName.toUpperCase()] || {
              icon: Sparkles, theme: DEFAULT_CATEGORY_THEME, banner: { title: catName.toUpperCase(), subtitle: "TOP PICKS", floatingElements: "sparkles" }
            };
            const customImg = cat.image?.url || cat.image;
            const resolvedImg = customImg ? resolveQuickImageUrl(customImg) : null;
            const IconComp = resolvedImg || (cat.iconId && ICON_COMPONENTS[cat.iconId]) || meta.icon || Sparkles;
            return { ...cat, id: cat._id, iconId: cat.iconId, icon: IconComp, theme: meta.theme, headerColor: cat.headerColor || null, banner: { ...meta.banner, textColor: "text-white" } };
          });

          const allHeaderFromAdmin = formattedHeaders.find(h => (h.slug?.toLowerCase() === "all") || (h.name?.toLowerCase() === "all"));
          const mergedAllCategory = allHeaderFromAdmin ? { ...ALL_CATEGORY, headerColor: allHeaderFromAdmin.headerColor || ALL_CATEGORY.headerColor, icon: allHeaderFromAdmin.icon || ALL_CATEGORY.icon } : ALL_CATEGORY;
          const headersWithoutAll = formattedHeaders
            .filter(h => !((h.slug?.toLowerCase() === "all") || (h.name?.toLowerCase() === "all")))
            .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
          
          const finalCategories = [mergedAllCategory, ...headersWithoutAll];
          setCategories(finalCategories);
          newDataCache.categories = finalCategories;

          let initialActive = mergedAllCategory;
          const storedHeaderReturn = window.sessionStorage.getItem(QUICK_HEADER_RETURN_STORAGE_KEY);
          const storedExpReturn = window.sessionStorage.getItem("experienceReturn");
          const restoreId = (storedHeaderReturn && JSON.parse(storedHeaderReturn)?.headerId) || (storedExpReturn && JSON.parse(storedExpReturn)?.headerId);
          if (restoreId) {
              const match = finalCategories.find(h => h._id === restoreId || h.id === restoreId);
              if (match) initialActive = match;
          }
          setActiveCategory(initialActive);
          newDataCache.activeCategory = initialActive;

          const formattedQuickCats = dbCats.filter((cat) => cat.type === "category").map((cat) => ({
            id: cat._id,
            name: cat.name,
            image: getQuickCategoryImage(cat),
            parentId: cat.parentId || cat.headerId || cat.parent?._id || cat.header?._id || cat.parent || cat.header
          }));
          setQuickCategories(formattedQuickCats);
          newDataCache.quickCategories = formattedQuickCats;
        }
        setIsBootstrapped(true); // Unblock the UI skeleton!
      }).catch(markFailed).finally(checkDone);

      // 2. Products (Filtered by user zone/location)
      withRetry(() => customerApi.getProducts(productParams)).then(prodRes => {
        if (seq !== fetchDataSeqRef.current) return;
        if (prodRes?.data?.success) {
          const rawResult = prodRes.data.result;
          const dbProds = Array.isArray(prodRes.data.results) ? prodRes.data.results : (Array.isArray(rawResult?.items) ? rawResult.items : (Array.isArray(rawResult) ? rawResult : []));
          const formattedProds = dbProds.map((p) => ({
            ...p, id: p._id, image: p.mainImage || p.image || QUICK_IMAGE_FALLBACK,
            price: Number(p.salePrice || 0) > 0 ? Number(p.salePrice) : Number(p.price || 0),
            originalPrice: Number(p.originalPrice || p.mrp || p.price || p.salePrice || 0),
            weight: p.weight || "1 unit", deliveryTime: "8-15 mins"
          }));
          setProducts(formattedProds);
          newDataCache.products = formattedProds;
        }
      }).catch(markFailed).finally(checkDone);

      // 3. Experience Sections
      withRetry(() => customerApi.getExperienceSections({ pageType: "home", ...productParams })).then(expRes => {
        if (seq !== fetchDataSeqRef.current) return;
        if (expRes?.data?.success) {
          const raw = expRes.data.result || expRes.data.results || expRes.data;
          const sections = Array.isArray(raw) ? raw : [];
          setExperienceSections(sections);
          newDataCache.experienceSections = sections;
        }
      }).catch(markFailed).finally(checkDone);

      // 4. Offer Sections
      withRetry(() => customerApi.getOfferSections(productParams)).then(sectionsRes => {
        if (seq !== fetchDataSeqRef.current) return;
        const sectionsList = sectionsRes?.data?.results || sectionsRes?.data?.result || sectionsRes?.data;
        const offerSecs = Array.isArray(sectionsList) ? sectionsList : [];
        setOfferSections(offerSecs);
        newDataCache.offerSections = offerSecs;
      }).catch(markFailed).finally(checkDone);

      // 5. Hero Config
      withRetry(() => customerApi.getHeroConfig({ pageType: "home" })).then(heroRes => {
        if (seq !== fetchDataSeqRef.current) return;
        if (heroRes?.data?.success) {
          const payload = heroRes.data.result || heroRes.data.results || heroRes.data;
          const config = payload && (payload.banners?.items?.length > 0 || payload.categoryIds?.length > 0)
            ? { banners: payload.banners || { items: [] }, categoryIds: payload.categoryIds || [] }
            : { banners: { items: [] }, categoryIds: [] };
          setHeroConfig(config);
          newDataCache.heroConfig = config;
        }
      }).catch(markFailed).finally(checkDone);

      // 6. Best Seller Sections
      withRetry(() => customerApi.getBestSellerSections(productParams)).then(bestRes => {
        if (seq !== fetchDataSeqRef.current) return;
        const sectionsList = bestRes?.data?.results || bestRes?.data?.result || bestRes?.data;
        const bestSecs = Array.isArray(sectionsList) ? sectionsList : [];
        setBestSellerSections(bestSecs);
        newDataCache.bestSellerSections = bestSecs;
      }).catch(markFailed).finally(checkDone);

    } catch (error) {
      console.error("Error fetching quick home data:", error);
      setIsLoading(false);
    }
  }, [locationKey, getQuickCategoryImage]);

  useEffect(() => {
    // Debounce: location is restored from cache, then updated by GPS/Food within moments of app open.
    const timer = setTimeout(fetchData, FETCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Fetch header-specific sections
  useEffect(() => {
    if (!activeCategory || activeCategory._id === "all") {
      setHeaderSections([]);
      setCategoryProducts(null); // reset to global products
      return;
    }

    const headerId = activeCategory._id;
    let cancelled = false;

    // Location-aware cache keys so switching zones busts the cache
    const hasValidLocation =
      Number.isFinite(currentLocation?.latitude) &&
      Number.isFinite(currentLocation?.longitude);
    const locationKey = hasValidLocation
      ? `${currentLocation.latitude}_${currentLocation.longitude}_${currentLocation?.zoneId || ""}`
      : "no_loc";
    const cacheKey = `${headerId}__${locationKey}`;

    const fetchHeader = async () => {
      if (globalQuickHomeCache.headerSections.has(cacheKey)) {
        setHeaderSections(globalQuickHomeCache.headerSections.get(cacheKey));
      } else {
        setLoadingHeaderSections(true);
        try {
          const res = await customerApi.getExperienceSections({
            pageType: "header",
            headerId,
            ...(hasValidLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : {}),
          });
          if (cancelled) return;
          if (res.data.success) {
            const raw = res.data.result || res.data.results || res.data;
            const sections = Array.isArray(raw) ? raw : [];
            setHeaderSections(sections);
            globalQuickHomeCache.headerSections.set(cacheKey, sections);
          }
        } catch (e) {
          console.error("Error fetching header sections:", e);
        } finally {
          if (!cancelled) setLoadingHeaderSections(false);
        }
      }
    };

    const fetchCategoryProducts = async () => {

      if (globalQuickHomeCache.categoryProducts.has(cacheKey)) {
        setCategoryProducts(globalQuickHomeCache.categoryProducts.get(cacheKey));
        return;
      }

      // Build params with zone/location for proper seller filtering
      const params = { categoryId: headerId, limit: 50 };
      if (hasValidLocation) {
        params.lat = currentLocation.latitude;
        params.lng = currentLocation.longitude;
      }
      const zoneId = currentLocation?.zoneId || currentLocation?.zone?._id || currentLocation?.zoneIdStr;
      if (zoneId) {
        params.zoneId = zoneId;
      }

      try {
        const res = await customerApi.getProducts(params);
        if (cancelled) return;
        if (res?.data?.success) {
          const rawResult = res.data.result;
          const dbProds = Array.isArray(res.data.results)
            ? res.data.results
            : Array.isArray(rawResult?.items)
            ? rawResult.items
            : Array.isArray(rawResult)
            ? rawResult
            : [];
          const formatted = dbProds.map((p) => ({
            ...p,
            id: p._id,
            image: p.mainImage || p.image || QUICK_IMAGE_FALLBACK,
            price: Number(p.salePrice || 0) > 0 ? Number(p.salePrice) : Number(p.price || 0),
            originalPrice: Number(p.originalPrice || p.mrp || p.price || p.salePrice || 0),
            weight: p.weight || "1 unit",
            deliveryTime: "8-15 mins",
          }));
          globalQuickHomeCache.categoryProducts.set(cacheKey, formatted);
          setCategoryProducts(formatted);
        }
      } catch (e) {
        console.error("Error fetching category products:", e);
      }
    };

    fetchHeader();
    fetchCategoryProducts();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, currentLocation]);

  return {
    categories,
    activeCategory,
    setActiveCategory,
    products,
    categoryProducts, // null when "All" is active, array when a specific category is selected
    quickCategories,
    experienceSections,
    offerSections,
    bestSellerSections,
    categoryMap,
    subcategoryMap,
    headerSections,
    heroConfig,
    isLoading: isLoading || !isBootstrapped,
    loadingHeaderSections,
    isBootstrapped,
    actions: {
        refresh: () => {
            globalQuickHomeCache.data = null;
            fetchData();
        }
    }
  };
};
