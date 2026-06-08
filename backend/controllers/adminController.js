import User from '../models/User.js';
import Donation from '../models/Donation.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { deleteFromCloudinary, extractPublicId } from '../utils/cloudinaryHelpers.js';
import { sendNGOVerificationApprovedEmail, sendNGOVerificationRejectedEmail } from '../services/emailService.js';

// @desc    Get all users (searchable, filterable by role, paginated)
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (status) {
      if (status === 'active') query.isActive = true;
      if (status === 'suspended') query.isActive = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      page: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend a user
// @route   PUT /api/v1/admin/users/:id/suspend
// @access  Private (Admin only)
export const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    if (user.role === 'admin') {
      return next(new ErrorResponse('Cannot suspend an administrator account', 400));
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been suspended`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reactivate a suspended user
// @route   PUT /api/v1/admin/users/:id/activate
// @access  Private (Admin only)
export const activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been reactivated`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending NGO verification requests
// @route   GET /api/v1/admin/ngos/requests
// @access  Private (Admin only)
export const getNGORequests = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;

    const query = {
      role: 'ngo',
      ngoVerificationStatus: status,
    };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const requests = await User.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: requests.length,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      page: pageNum,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject NGO verification request
// @route   PUT /api/v1/admin/ngos/:id/verify
// @access  Private (Admin only)
export const verifyNGO = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return next(new ErrorResponse('Please specify a valid verification action: approve or reject', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`NGO user not found with id of ${req.params.id}`, 404));
    }

    if (user.role !== 'ngo') {
      return next(new ErrorResponse('User is not an NGO', 400));
    }

    if (action === 'approve') {
      user.isVerifiedNGO = true;
      user.ngoVerificationStatus = 'approved';
      await user.save();
      // Send verification email to NGO
      sendNGOVerificationApprovedEmail(user);
    } else {
      user.isVerifiedNGO = false;
      user.ngoVerificationStatus = 'rejected';
      await user.save();
      // Send rejection email to NGO
      sendNGOVerificationRejectedEmail(user);
    }

    res.status(200).json({
      success: true,
      message: `NGO verification request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations for administration / moderation
// @route   GET /api/v1/admin/donations
// @access  Private (Admin only)
export const getDonations = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (search) {
      query.foodName = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Donation.countDocuments(query);
    const donations = await Donation.find(query)
      .populate('donor', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: donations.length,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      page: pageNum,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate / delete donation listing (permanently)
// @route   DELETE /api/v1/admin/donations/:id
// @access  Private (Admin only)
export const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Business Rule: Only pending, expired, or rejected donations can be deleted
    const allowedStatuses = ['pending', 'expired', 'rejected'];
    if (!allowedStatuses.includes(donation.status)) {
      return next(
        new ErrorResponse(
          `Cannot delete donation. Current status is already '${donation.status}'`,
          400
        )
      );
    }

    // Delete associated images from Cloudinary before deleting from database
    if (donation.images && donation.images.length > 0) {
      const deletePromises = donation.images.map((img) => {
        const publicId = extractPublicId(img);
        if (publicId) return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Donation listing removed successfully by administrator',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics for administrator overview
// @route   GET /api/v1/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const donorCount = await User.countDocuments({ role: 'donor' });
    const ngoCount = await User.countDocuments({ role: 'ngo' });
    const recipientCount = await User.countDocuments({ role: 'recipient' });
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    const totalDonations = await Donation.countDocuments();
    const pendingDonations = await Donation.countDocuments({ status: 'pending' });
    const acceptedDonations = await Donation.countDocuments({ status: { $in: ['accepted', 'claimed'] } });
    const pickedUpDonations = await Donation.countDocuments({ status: 'picked up' });
    const deliveredDonations = await Donation.countDocuments({ status: 'delivered' });

    const pendingNGOVerifications = await User.countDocuments({
      role: 'ngo',
      ngoVerificationStatus: 'pending',
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          donors: donorCount,
          ngos: ngoCount,
          recipients: recipientCount,
          active: activeUsers,
          suspended: suspendedUsers,
        },
        donations: {
          total: totalDonations,
          pending: pendingDonations,
          accepted: acceptedDonations,
          pickedUp: pickedUpDonations,
          delivered: deliveredDonations,
        },
        pendingNGOVerifications,
      },
    });
  } catch (error) {
    next(error);
  }
};
