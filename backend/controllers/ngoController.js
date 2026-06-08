import User from '../models/User.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';

// @desc    Find nearby NGOs sorted by proximity
// @route   GET /api/v1/ngos/nearby
// @access  Private (Authenticated users)
export const getNearbyNGOs = async (req, res, next) => {
  try {
    const pincode = req.user?.pincode || req.query.pincode;

    if (!pincode) {
      return next(new ErrorResponse('Pincode is required to match NGOs.', 400));
    }

    const ngos = await User.find({
      role: { $in: ['ngo', 'recipient'] },
      pincode: pincode,
      isActive: true,
    }).select('name email phone role location pincode');

    const mappedNgos = ngos.map(ngo => ({
      ...ngo.toObject(),
      distance: 0 // Mock distance for display structure consistency
    }));

    res.status(200).json({
      success: true,
      count: mappedNgos.length,
      ngos: mappedNgos,
    });
  } catch (error) {
    next(error);
  }
};
