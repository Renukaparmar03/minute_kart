import axios from 'axios';
import { ApiError } from '../../../utils/ApiError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

/**
 * Map Google Maps address components to a flatter structure
 */
const mapAddressComponents = (components) => {
  const get = (type) => {
    const c = components.find((x) => x.types?.includes(type));
    return c ? c.long_name : '';
  };
  const country = get('country');
  const state = get('administrative_area_level_1');
  const city = get('locality') || get('administrative_area_level_2') || get('sublocality');
  const area = get('sublocality') || get('neighborhood') || '';
  const pincode = get('postal_code');
  return { country, state, city, area, pincode };
};

/**
 * @desc    Geocode an address string to coordinates
 * @route   GET /api/v1/quick-commerce/location/geocode
 * @access  Public
 */
export const geocodeAddress = asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address || !String(address).trim()) {
    throw new ApiError(400, 'Address query parameter is required');
  }

  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;
  if (!key) {
    console.error('GOOGLE_MAPS_API_KEY is missing in environment variables');
    throw new ApiError(500, 'Maps API key not configured on server');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${key}`;
    
    const { data } = await axios.get(url);

    if (data.status === 'ZERO_RESULTS') {
      return res.status(404).json({
        success: false,
        message: 'No location found for the provided address',
      });
    }

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status, data.error_message);
      throw new ApiError(500, `Maps API error: ${data.status}`);
    }

    const first = data.results[0];
    const { lat, lng } = first.geometry.location;
    const components = mapAddressComponents(first.address_components || []);

    res.status(200).json({
      success: true,
      data: {
        latitude: lat,
        longitude: lng,
        formattedAddress: first.formatted_address,
        ...components,
        placeId: first.place_id,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Geocoding error:', error.message);
    throw new ApiError(500, 'Failed to geocode address');
  }
});

// In-memory cache for reverse geocode results (1-hour TTL, ~100m grid)
const reverseGeocodeCache = new Map();
const MAX_CACHE_ENTRIES = 1000;

/**
 * @desc    Reverse geocode coordinates to an address
 * @route   GET /api/v1/quick-commerce/location/reverse-geocode
 * @access  Public
 */
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, 'lat and lng query parameters are required');
  }

  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    throw new ApiError(400, 'Invalid lat or lng values');
  }

  const cacheKey = `${numLat.toFixed(3)},${numLng.toFixed(3)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return res.status(200).json({
      success: true,
      data: {
        ...cached.data,
        latitude: numLat,
        longitude: numLng,
      },
    });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;
  if (!key) {
    throw new ApiError(500, 'Maps API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${numLat},${numLng}&key=${key}`;
  const { data } = await axios.get(url, { timeout: 6000 });

  if (data.status === 'ZERO_RESULTS') {
    throw new ApiError(404, 'Address not found');
  }

  if (data.status !== 'OK') {
    throw new ApiError(500, `Maps API error: ${data.status}`);
  }

  const first = data.results[0];
  const components = mapAddressComponents(first.address_components || []);

  const responseData = {
    formattedAddress: first.formatted_address,
    ...components,
    latitude: numLat,
    longitude: numLng,
    placeId: first.place_id,
  };

  // Cache result
  if (reverseGeocodeCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = reverseGeocodeCache.keys().next().value;
    reverseGeocodeCache.delete(firstKey);
  }
  reverseGeocodeCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

  res.status(200).json({
    success: true,
    data: responseData,
  });
});
