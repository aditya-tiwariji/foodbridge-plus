import User from '../models/User.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { geocodeAddress } from '../services/mapsService.js';
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from '../utils/cloudinaryHelpers.js';

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const { name, phone, address, pincode } = req.body;

    // Track if location details changed to re-trigger geocoding
    const hasAddressChanged = address && address !== user.location?.address;
    const hasPincodeChanged = pincode && pincode !== user.pincode;
    if (hasAddressChanged || hasPincodeChanged) {
      const targetAddress = address || user.location?.address;
      
      if (!targetAddress) {
        return next(new ErrorResponse('Physical address is required to calculate coordinates.', 400));
      }

      console.log(`Re-running geocoding for profile: "${targetAddress}"`);
      try {
        const geoResult = await geocodeAddress(targetAddress);
        user.location = {
          address: geoResult.formattedAddress || targetAddress,
          coordinates: [geoResult.longitude, geoResult.latitude],
        };
        user.pincode = geoResult.pincode || pincode || user.pincode;
        if (!user.pincode) {
          return next(new ErrorResponse('Could not resolve PIN code for this address. Please provide a valid address and PIN code.', 400));
        }
      } catch (err) {
        console.error('Geocoding failed for profile update:', err.message);
        return next(new ErrorResponse(`Geocoding failed for the address "${targetAddress}". Please enter a valid, recognizable physical address.`, 400));
      }
    } else {
      if (address) {
        user.location.address = address;
      }
      if (pincode) {
        user.pincode = pincode;
      }
    }

    // Handle single profile photo upload if file exists
    if (req.file) {
      try {
        console.log('Uploading profile image to Cloudinary...');
        const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'foodbridge/profiles');

        // Clean up previous image to free Cloudinary space
        if (user.profileImage) {
          const oldPublicId = extractPublicId(user.profileImage);
          if (oldPublicId) {
            console.log(`Deleting old profile image from Cloudinary: ${oldPublicId}`);
            await deleteFromCloudinary(oldPublicId).catch((deleteErr) => {
              console.error('Failed to delete old profile photo:', deleteErr.message);
            });
          }
        }

        user.profileImage = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error('Profile photo upload failed:', uploadErr.message);
        return next(new ErrorResponse(`Profile photo upload failed: ${uploadErr.message}`, 500));
      }
    }

    // Update remaining simple text fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/users/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ErrorResponse('Please provide current password, new password, and confirmation password', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new ErrorResponse('New password and confirmation password do not match', 400));
    }

    if (newPassword.length < 8) {
      return next(new ErrorResponse('New password must be at least 8 characters long', 400));
    }

    // Must select password field explicitly since select: false is set in schema
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Pre-save hook hashes the password if modified
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
