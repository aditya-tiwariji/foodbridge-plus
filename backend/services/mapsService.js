import { ErrorResponse } from '../middleware/errorMiddleware.js';

/**
 * Convert an address to geographic coordinates (latitude, longitude)
 * @param {string} address - Physical address
 * @returns {Promise<object>} Formatted address, latitude, and longitude
 */
export const geocodeAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodBridge-Application/1.0 (contact@foodbridge.org)'
      }
    });

    if (!response.ok) {
      throw new ErrorResponse(`Nominatim Geocoding API error: status ${response.status}`, response.status || 400);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new ErrorResponse('No location found for the provided address.', 400);
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    const formattedAddress = result.display_name;
    const pincode = result.address && result.address.postcode
      ? result.address.postcode.replace(/\s+/g, '')
      : '';

    return {
      formattedAddress,
      latitude,
      longitude,
      pincode,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(`Geocoding failed: ${error.message}`, 500);
  }
};

/**
 * Convert coordinates (latitude, longitude) to a physical address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodBridge-Application/1.0 (contact@foodbridge.org)'
      }
    });

    if (!response.ok) {
      throw new ErrorResponse(`Nominatim Reverse Geocoding API error: status ${response.status}`, response.status || 400);
    }

    const data = await response.json();

    if (!data || !data.display_name) {
      throw new ErrorResponse('No physical address found for the provided coordinates.', 400);
    }

    const formattedAddress = data.display_name;
    return formattedAddress;
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(`Reverse geocoding failed: ${error.message}`, 500);
  }
};

/**
 * Calculate distance between two coordinate sets on Earth using Haversine formula (fallback/helper)
 * @param {number} lat1 - Latitude point 1
 * @param {number} lon1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lon2 - Longitude point 2
 * @returns {object} Calculated distance in meters and kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = R * c; // Distance in meters
  const kilometers = meters / 1000;

  return {
    meters: Math.round(meters),
    kilometers: Math.round(kilometers * 100) / 100,
  };
};
