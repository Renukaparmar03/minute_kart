import { useEffect } from "react";

// Fetches the user's live GPS location once per app open and broadcasts it, so
// Food and Quick both show items for where the user actually is (not a stale
// cached address or the hardcoded default).

const SAME_PLACE_METERS = 100;

let bootstrapPromise = null;

const readCachedLocation = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem("userLocation") || "null");
    const latitude = Number(parsed?.latitude);
    const longitude = Number(parsed?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { ...parsed, latitude, longitude };
  } catch {
    return null;
  }
};

const distanceMeters = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

const getPosition = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const getCurrentCoords = async () => {
  try {
    const position = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 });
    return position.coords;
  } catch (error) {
    // Permission denied: nothing more to try. Timeout/unavailable: retry with coarse location.
    if (error?.code === 1) throw error;
    const position = await getPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 });
    return position.coords;
  }
};

const reverseGeocode = async (latitude, longitude) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({ latlng: `${latitude},${longitude}`, key: apiKey });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.results?.[0];
  if (data?.status !== "OK" || !result) return null;

  const components = result.address_components || [];
  const getComponent = (types) =>
    components.find((c) => types.every((t) => c.types.includes(t)))?.long_name || "";

  return {
    formattedAddress: result.formatted_address || "",
    area:
      getComponent(["sublocality_level_1"]) ||
      getComponent(["sublocality"]) ||
      getComponent(["neighborhood"]),
    city: getComponent(["locality"]) || getComponent(["administrative_area_level_2"]),
    state: getComponent(["administrative_area_level_1"]),
    postalCode: getComponent(["postal_code"]),
  };
};

const persistAndBroadcast = (location) => {
  const userLocation = {
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.formattedAddress,
    formattedAddress: location.formattedAddress,
    city: location.city || "",
    state: location.state || "",
    postalCode: location.postalCode || "",
    street: location.formattedAddress || "",
    area: location.area || "",
    location: { type: "Point", coordinates: [location.longitude, location.latitude] },
  };

  window.localStorage.setItem("userLocation", JSON.stringify(userLocation));
  window.localStorage.setItem("deliveryAddressMode", "current");
  // Quick commerce LocationContext cache
  window.localStorage.setItem(
    "location_v2",
    JSON.stringify({
      address: location.formattedAddress,
      city: location.city || "",
      state: location.state || "",
      pincode: location.postalCode || "",
      latitude: location.latitude,
      longitude: location.longitude,
      time: "12-15 mins",
    }),
  );

  window.dispatchEvent(new CustomEvent("userLocationUpdated", { detail: { location: userLocation } }));
  return userLocation;
};

export const bootstrapCurrentLocation = () => {
  if (bootstrapPromise) return bootstrapPromise;
  if (typeof window === "undefined" || !navigator?.geolocation) {
    return Promise.resolve({ ok: false, error: "Geolocation is not supported" });
  }

  bootstrapPromise = (async () => {
    try {
      const { latitude, longitude } = await getCurrentCoords();
      const cached = readCachedLocation();

      // Still at the cached spot: keep its address and skip a needless refetch of every list
      if (cached && cached.formattedAddress && distanceMeters(cached, { latitude, longitude }) < SAME_PLACE_METERS) {
        return { ok: true, location: cached, unchanged: true };
      }

      let address = null;
      try {
        address = await reverseGeocode(latitude, longitude);
      } catch {
        // Coordinates alone are enough to scope items by zone
      }

      const location = persistAndBroadcast({
        latitude,
        longitude,
        formattedAddress:
          address?.formattedAddress || `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
        area: address?.area,
        city: address?.city,
        state: address?.state,
        postalCode: address?.postalCode,
      });
      return { ok: true, location };
    } catch (error) {
      // Denied/unavailable: keep using the cached or manually chosen address
      return { ok: false, error: error?.message || "Unable to fetch current location" };
    }
  })();

  return bootstrapPromise;
};

// Call from customer-facing layouts; runs once per app open no matter how many mount
export const useBootstrapCurrentLocation = () => {
  useEffect(() => {
    bootstrapCurrentLocation();
  }, []);
};
