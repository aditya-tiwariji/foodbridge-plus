import { geocodeAddress, reverseGeocodeCoordinates } from '../services/mapsService.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';

// @desc    Geocode a string address into coordinates
// @route   POST /api/v1/location/geocode
// @access  Private (Authenticated users)
export const geocode = async (req, res, next) => {
  try {
    const address = req.body.address || req.query.address;

    if (!address) {
      return next(new ErrorResponse('Please provide an address to geocode', 400));
    }

    const locationData = await geocodeAddress(address);

    res.status(200).json({
      success: true,
      ...locationData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reverse geocode coordinates into a string address
// @route   POST /api/v1/location/reverse-geocode
// @access  Private (Authenticated users)
export const reverseGeocode = async (req, res, next) => {
  try {
    const latitude = req.body.latitude !== undefined ? req.body.latitude : req.query.latitude;
    const longitude = req.body.longitude !== undefined ? req.body.longitude : req.query.longitude;

    if (latitude === undefined || longitude === undefined) {
      return next(new ErrorResponse('Please provide both latitude and longitude values', 400));
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return next(new ErrorResponse('Invalid latitude or longitude values', 400));
    }

    const address = await reverseGeocodeCoordinates(lat, lng);

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    next(error);
  }
};
