import { useEffect, useState } from "react";
import { useZone } from "@food/hooks/useZone";
import { customerApi } from "../services/customerApi";

// Quick sellers can be attached to a food zone or a quick zone (seller.shopInfo.zoneSource),
// so a location is serviceable for quick commerce if it is inside either kind of zone.

const QUICK_ZONES_TTL_MS = 60 * 1000;
let quickZonesPromise = null;
let quickZonesFetchedAt = 0;

const loadQuickZones = () => {
  if (!quickZonesPromise || Date.now() - quickZonesFetchedAt > QUICK_ZONES_TTL_MS) {
    quickZonesFetchedAt = Date.now();
    quickZonesPromise = customerApi
      .getPublicZones()
      .then((res) => res?.data?.data?.zones || [])
      .catch((error) => {
        quickZonesPromise = null;
        throw error;
      });
  }
  return quickZonesPromise;
};

// Same ray-casting check the backend uses (zone coordinates are [{ latitude, longitude }])
const isPointInPolygon = (lat, lng, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].longitude);
    const yi = Number(polygon[i].latitude);
    const xj = Number(polygon[j].longitude);
    const yj = Number(polygon[j].latitude);
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export function useQuickZoneStatus(location) {
  const { zoneStatus: foodZoneStatus } = useZone(location);
  // null = not known yet (no location, request pending or failed) -> never block the UI on it
  const [inQuickZone, setInQuickZone] = useState(null);

  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setInQuickZone(null);
      return;
    }
    let cancelled = false;
    loadQuickZones()
      .then((zones) => {
        if (cancelled) return;
        setInQuickZone(zones.some((zone) => isPointInPolygon(lat, lng, zone.coordinates)));
      })
      .catch(() => {
        if (!cancelled) setInQuickZone(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return {
    isOutOfService: foodZoneStatus === "OUT_OF_SERVICE" && inQuickZone === false,
    isInService: foodZoneStatus === "IN_SERVICE" || inQuickZone === true,
  };
}
