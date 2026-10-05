import { ApiError } from './ApiError.js';

export const normalizePoint = (coordinates, fieldName = 'coordinates') => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(400, `${fieldName} must be [longitude, latitude]`);
  }

  const [longitude, latitude] = coordinates.map(Number);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new ApiError(400, `${fieldName} must contain valid longitude and latitude values`);
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new ApiError(400, `${fieldName} must be valid [longitude, latitude]`);
  }

  return [longitude, latitude];
};

export const toPoint = (coordinates, fieldName) => ({
  type: 'Point',
  coordinates: normalizePoint(coordinates, fieldName),
});

/**
 * Ray-casting point-in-polygon for lat/lng polygons.
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {Array} polygon Array of {latitude, longitude} objects
 * @returns {boolean}
 */
export const isPointInPolygon = (lat, lng, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Resolves active seller IDs matching a given user location or zone ID.
 * @param {Object} param0 { lat, lng, zoneId }
 * @param {Object} models { QuickZone, Seller }
 * @returns {Promise<Array<string>|null>} Array of seller ID strings if location/zone specified, null if no filter criteria provided.
 */
export const getMatchingSellerIdsForLocation = async ({ lat, lng, zoneId }, { QuickZone, Seller, mongoose }) => {
  let targetZoneId = zoneId ? String(zoneId) : null;
  let activeZoneCoords = null;

  if (!targetZoneId && lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      const allActiveZones = await QuickZone.find({ isActive: true }).lean();
      const matchedZone = allActiveZones.find(z => isPointInPolygon(latNum, lngNum, z.coordinates));
      if (matchedZone) {
        targetZoneId = String(matchedZone._id);
        activeZoneCoords = matchedZone.coordinates;
      }
    }
  }

  if (!targetZoneId && !activeZoneCoords) {
    return null;
  }

  const sellerQuery = { isActive: true };
  if (targetZoneId) {
    const targetObjId = mongoose && mongoose.Types.ObjectId.isValid(targetZoneId)
      ? new mongoose.Types.ObjectId(targetZoneId)
      : null;
    
    const zoneOrConditions = [
      { 'shopInfo.zoneId': targetZoneId },
      { zoneId: targetZoneId }
    ];
    if (targetObjId) {
      zoneOrConditions.push({ 'shopInfo.zoneId': targetObjId });
      zoneOrConditions.push({ zoneId: targetObjId });
    }
    sellerQuery.$or = zoneOrConditions;
  }

  const zoneSellers = await Seller.find(sellerQuery).select('_id location shopInfo').lean();
  let matchingSellerIds = zoneSellers.map(s => String(s._id));

  if (activeZoneCoords) {
    const polygonSellers = await Seller.find({ isActive: true }).select('_id location shopInfo').lean();
    const inPolygonIds = polygonSellers
      .filter(s => s.location?.latitude && s.location?.longitude && isPointInPolygon(Number(s.location.latitude), Number(s.location.longitude), activeZoneCoords))
      .map(s => String(s._id));
    matchingSellerIds = [...new Set([...matchingSellerIds, ...inPolygonIds])];
  }

  return matchingSellerIds;
};

/**
 * Builds a MongoDB query filter clause for products based on zone seller IDs.
 * @param {Array<string>|null} matchingSellerIds
 * @param {Object} mongoose
 * @returns {Object|null}
 */
export const buildZoneProductFilter = (matchingSellerIds, mongoose) => {
  if (!Array.isArray(matchingSellerIds)) {
    return null;
  }
  const sellerObjectIds = mongoose
    ? matchingSellerIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
    : [];

  const allMatchingIds = [...new Set([...matchingSellerIds, ...sellerObjectIds])];

  return {
    $or: [
      { sellerId: { $in: allMatchingIds } },
      { sellerId: { $exists: false } },
      { sellerId: null }
    ]
  };
};

