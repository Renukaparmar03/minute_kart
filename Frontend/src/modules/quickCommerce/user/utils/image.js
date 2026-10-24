import { optimizeCloudinaryUrl } from "@/shared/utils/cloudinaryUtils";

// Shown whenever a product / category has no image (or its image fails to load).
// Never use stock/static photos as a stand-in - the app logo is the only fallback.
export const QUICK_IMAGE_FALLBACK = "/assets/minute%20kart%20logo%20.jpg.jpeg";

// Swap a broken <img> for the fallback logo (once, to avoid an onError loop).
export const handleQuickImageError = (event) => {
  const img = event?.currentTarget || event?.target;
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = QUICK_IMAGE_FALLBACK;
};

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

export const resolveQuickImageUrl = (value) => {
  if (!value) return null;

  if (value === QUICK_IMAGE_FALLBACK) return value;

  const raw = String(value).trim();
  if (!raw || raw === "null" || raw === "undefined") return null;

  const normalized = raw.replace(/\\/g, "/");
  let resolvedUrl = normalized;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    resolvedUrl = normalized;
  } else if (normalized.startsWith("//")) {
    resolvedUrl = `https:${normalized}`;
  } else {
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    resolvedUrl = `${API_BASE_URL}${path}`;
  }

  // Optimize Cloudinary URLs to use webp/f_auto
  return optimizeCloudinaryUrl(resolvedUrl);
};
