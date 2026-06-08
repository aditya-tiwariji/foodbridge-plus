import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { geocodeAddress } from '../services/mapsService.js';
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from '../utils/cloudinaryHelpers.js';
import {
  sendDonationCreatedEmail,
  sendDonationAcceptedEmail,
  sendPickupEmail,
  sendDeliveredEmail,
} from '../services/emailService.js';
import {
  notifyNearbyNGOs,
  notifyDonorDonationAccepted,
  notifyDonorDonationPickedUp,
  notifyDonorDonationDelivered,
  notifyDonorStartPickup,
  notifyDonorDonationExpired,
  notifyDonorClaimCancelled,
} from '../socket/socketEvents.js';

// Helper to automatically check and transition pending food drives past their expiration date to 'expired' and notify their donors
const checkExpiredDonations = async () => {
  try {
    const currentDate = new Date();
    const expiredDonations = await Donation.find({
      status: 'pending',
      expiryDate: { $lte: currentDate },
    });

    for (const donation of expiredDonations) {
      donation.status = 'expired';
      await donation.save({ validateBeforeSave: false });

      // Create database notification for the donor
      const NotificationModel = mongoose.model('Notification');
      await NotificationModel.create({
        user: donation.donor,
        title: 'Donation Expired',
        message: `Your donation listing for "${donation.foodName}" has expired.`,
        type: 'donation_expired',
      });

      // Emit socket notification to the donor
      notifyDonorDonationExpired(donation);
    }
  } catch (error) {
    console.error('Error checking expired donations:', error.message);
  }
};

// @desc    Create a new food donation listing
// @route   POST /api/v1/donations
// @access  Private (Donor only)
export const createDonation = async (req, res, next) => {
  try {
    // Attach the donor ID from the authenticated user
    req.body.donor = req.user.id;

    // Handle geocoding/pincode extraction from address
    if (req.body.location && req.body.location.address) {
      let geoResult;
      try {
        geoResult = await geocodeAddress(req.body.location.address);
      } catch (err) {
        console.error('Donation creation geocoding failed:', err.message);
        return next(new ErrorResponse(`Geocoding failed for the donation address "${req.body.location.address}". Please enter a valid, recognizable physical address.`, 400));
      }

      const pincode = geoResult.pincode || req.body.pincode;
      if (!pincode) {
        return next(new ErrorResponse('Could not extract a valid 6-digit Indian PIN code for the donation address. Please include a 6-digit PIN code in your address.', 400));
      }

      req.body.pincode = pincode;
      req.body.latitude = geoResult.latitude;
      req.body.longitude = geoResult.longitude;
      req.body.location.coordinates = [geoResult.longitude, geoResult.latitude];
      req.body.location.address = geoResult.formattedAddress || req.body.location.address;
      req.body.address = geoResult.formattedAddress || req.body.location.address;
    } else {
      return next(new ErrorResponse('Address location details are required', 400));
    }

    // Handle image uploads if files are uploaded
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, 'foodbridge/donations')
      );
      const uploadResults = await Promise.all(uploadPromises);
      req.body.images = uploadResults.map((result) => result.secure_url);
    }

    const donation = await Donation.create(req.body);

    // Send listing confirmation email to donor (non-blocking)
    sendDonationCreatedEmail(donation, req.user);

    // Notify nearby NGOs via real-time sockets
    notifyNearbyNGOs(donation);

    res.status(201).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations (paginated, filtered, searched)
// @route   GET /api/v1/donations
// @access  Public
export const getDonations = async (req, res, next) => {
  try {
    await checkExpiredDonations();

    const { status, category, donor, search, page = 1, limit = 10, pincode } = req.query;

    const query = {};

    // Restrict NGO / Recipient to their own pincode and pending donations only
    if (req.user && (req.user.role === 'ngo' || req.user.role === 'recipient')) {
      query.pincode = req.user.pincode;
      query.status = 'pending';
    } else {
      // For donors / admins, apply requested status filtering
      if (status) {
        if (status === 'claimed') {
          query.status = { $in: ['claimed', 'accepted', 'on the way', 'picked up'] };
        } else {
          query.status = status;
        }
      } else {
        query.status = { $ne: 'deleted' };
      }
      if (pincode) {
        query.pincode = pincode;
      }
    }

    console.log("TRACE getDonations:");
    console.log("  NGO pincode:", req.user?.pincode || 'N/A');
    console.log("  Donation pincode:", query.pincode || 'N/A');
    console.log("  Mongo query:", JSON.stringify(query));

    // Apply other filtering
    if (category) {
      query.category = category;
    }
    if (donor) {
      query.donor = donor;
    }

    // Apply search on foodName (case-insensitive regex)
    if (search) {
      query.foodName = { $regex: search, $options: 'i' };
    }

    // Pagination calculations
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Run query with populate
    const totalItems = await Donation.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const donations = await Donation.find(query)
      .populate('donor', 'name phone')
      .populate('acceptedBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log("  Result count:", donations.length);

    res.status(200).json({
      success: true,
      page: pageNum,
      totalPages,
      totalItems,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donation by ID
// @route   GET /api/v1/donations/:id
// @access  Public
export const getDonationById = async (req, res, next) => {
  try {
    await checkExpiredDonations();

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name phone email')
      .populate('acceptedBy', 'name phone email')
      .populate('claimedBy', 'name phone email');

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Security check: NGO / Recipient can only see donations from their own pincode
    if (req.user && (req.user.role === 'ngo' || req.user.role === 'recipient')) {
      if (donation.pincode !== req.user.pincode) {
        return next(new ErrorResponse('Not authorized to access donations from other pincodes', 403));
      }
    }

    const donationObj = donation.toObject();

    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    const isOwner = req.user && donationObj.donor?._id?.toString() === userId;
    const isAcceptedNGO = req.user && (
      donationObj.acceptedBy?._id?.toString() === userId ||
      donationObj.claimedBy?._id?.toString() === userId
    );
    const isAdmin = req.user && req.user.role === 'admin';
    const isAuthorizedToSeeContact = isOwner || isAcceptedNGO || isAdmin;

    console.log("TRACE getDonationById:");
    console.log("  donation.claimedBy (populated object or id):", donationObj.claimedBy);
    console.log("  req.user.id:", req.user?.id || req.user?._id?.toString());
    console.log("  ownership validation result (isAuthorizedToSeeContact):", isAuthorizedToSeeContact);
    console.log("  donation.location:", donationObj.location);
    console.log("  donation.latitude:", donationObj.latitude);
    console.log("  donation.longitude:", donationObj.longitude);
    console.log("  response payload coordinates:", donationObj.location?.coordinates);

    if (!isAuthorizedToSeeContact) {
      donationObj.phone = 'Phone number hidden until accepted';
      donationObj.address = 'Address hidden until accepted';
      donationObj.latitude = null;
      donationObj.longitude = null;
      if (donationObj.location) {
        donationObj.location.address = 'Address hidden until accepted';
        donationObj.location.coordinates = [0, 0];
      }
      if (donationObj.donor) {
        donationObj.donor.phone = 'Phone number hidden until accepted';
        donationObj.donor.email = 'Email hidden until accepted';
      }
    }

    console.log("  response payload sent to frontend (donationObj):", JSON.stringify(donationObj));

    res.status(200).json({
      success: true,
      donation: donationObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update food donation details
// @route   PUT /api/v1/donations/:id
// @access  Private (Donor owner only)
export const updateDonation = async (req, res, next) => {
  try {
    let donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if the user is the donor who listed the donation
    if (donation.donor.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this donation listing', 403));
    }

    // Business Rule: Accepted, Picked Up, and Delivered donations cannot be updated
    if (donation.status !== 'pending') {
      return next(
        new ErrorResponse(
          `Cannot edit donation. Current status is already '${donation.status}'`,
          400
        )
      );
    }

    // Parse existing images array to preserve, delete, or append
    let currentImages = [];
    if (req.body.images) {
      currentImages = typeof req.body.images === 'string'
        ? JSON.parse(req.body.images)
        : req.body.images;
    } else {
      // Default to keeping all current images if field not provided
      currentImages = [...donation.images];
    }

    // Find and delete removed images from Cloudinary
    const imagesToDelete = donation.images.filter((img) => !currentImages.includes(img));
    if (imagesToDelete.length > 0) {
      const deletePromises = imagesToDelete.map((img) => {
        const publicId = extractPublicId(img);
        if (publicId) return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
    }

    // Upload new image files if any
    if (req.files && req.files.length > 0) {
      if (currentImages.length + req.files.length > 5) {
        return next(new ErrorResponse('Too many files. A maximum of 5 images is allowed per donation.', 400));
      }
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, 'foodbridge/donations')
      );
      const uploadResults = await Promise.all(uploadPromises);
      const newUrls = uploadResults.map((result) => result.secure_url);
      currentImages = [...currentImages, ...newUrls];
    }

    // Bind final list back to req.body
    req.body.images = currentImages;

    // Only allow editing specific fields
    const { foodName, category, quantity, description, expiryDate, pickupTime, phone, location, images } = req.body;

    let pincode = donation.pincode;
    let latitude = donation.latitude;
    let longitude = donation.longitude;
    let address = donation.address;
    let updatedLocation = location || donation.location;

    if (location && location.address) {
      try {
        const geoResult = await geocodeAddress(location.address);
        pincode = geoResult.pincode;
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        updatedLocation.coordinates = [longitude, latitude];
      } catch (err) {
        console.error('Donation update geocoding failed, trying fallbacks:', err.message);
        if (location.coordinates && location.coordinates.length === 2) {
          longitude = location.coordinates[0];
          latitude = location.coordinates[1];
          updatedLocation.coordinates = [longitude, latitude];
        }
      }

      // Extract pincode via regex if not returned by geocode
      if (!pincode) {
        const match = location.address.match(/\b[1-9][0-9]{5}\b/);
        if (match) {
          pincode = match[0];
        }
      }

      // If still no pincode, fallback to the logged-in user's pincode
      if (!pincode && req.user && req.user.pincode) {
        pincode = req.user.pincode;
      }

      if (!pincode) {
        return next(new ErrorResponse('Could not extract a valid 6-digit Indian PIN code for the donation address. Please include a 6-digit PIN code in your address.', 400));
      }

      address = location.address;
    }

    donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        foodName,
        category,
        quantity,
        description,
        expiryDate,
        pickupTime,
        phone,
        location: updatedLocation,
        pincode,
        latitude,
        longitude,
        address,
        images,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete food donation listing
// @route   DELETE /api/v1/donations/:id
// @access  Private (Donor owner or Admin only)
export const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if owner or admin
    const isOwner = donation.donor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ErrorResponse('Not authorized to delete this donation listing', 403));
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

    // Delete associated images from Cloudinary before marking as deleted
    if (donation.images && donation.images.length > 0) {
      const deletePromises = donation.images.map((img) => {
        const publicId = extractPublicId(img);
        if (publicId) return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
      donation.images = [];
    }

    donation.status = 'deleted';
    donation.statusHistory.push({
      status: 'deleted',
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    await donation.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Donation listing removed successfully',
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept food donation (NGO only)
// @route   PATCH /api/v1/donations/:id/accept
// @access  Private (NGO / Recipient only)
export const acceptDonation = async (req, res, next) => {
  try {
    // Check if NGO is verified
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can accept donations.', 403));
    }

    // Ensure the donation belongs to the same pincode
    const checkExists = await Donation.findById(req.params.id);
    if (!checkExists) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }
    if (req.user && (req.user.role === 'ngo' || req.user.role === 'recipient')) {
      if (checkExists.pincode !== req.user.pincode) {
        return next(new ErrorResponse('Not authorized to accept donations from other pincodes', 403));
      }
    }

    console.log("CLAIM REQUEST NGO:", req.user?._id);
    console.log("DONATION BEFORE CLAIM:", checkExists);

    // Atomic findOneAndUpdate check status 'pending' to prevent double-claiming
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', pincode: req.user.pincode },
      {
        $set: {
          status: 'claimed',
          claimedBy: req.user.id,
          claimedAt: new Date(),
          acceptedBy: req.user.id,
        },
        $push: {
          statusHistory: {
            status: 'claimed',
            changedAt: new Date(),
            changedBy: req.user.id,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('donor', 'name phone email').populate('claimedBy', 'name phone email').populate('acceptedBy', 'name phone email');

    if (!donation) {
      // Check if it exists at all
      const checkExistsInner = await Donation.findById(req.params.id);
      if (!checkExistsInner) {
        return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
      }
      return next(
        new ErrorResponse(
          `Donation cannot be accepted. Current status is already '${checkExistsInner.status}'`,
          400
        )
      );
    }

    console.log("DONATION AFTER CLAIM:", donation);

    // Send claim notification email to donor (non-blocking)
    sendDonationAcceptedEmail(donation, donation.donor, req.user);

    // Notify donor via real-time sockets
    notifyDonorDonationAccepted(donation, req.user.name);

    try {
      const NotificationModel = mongoose.model('Notification');
      await NotificationModel.create({
        user: req.user.id,
        title: 'Donation Claimed Successfully',
        message: `You have successfully claimed the donation "${donation.foodName}".`,
        type: 'donation_claimed',
      });
    } catch (notificationErr) {
      console.error('[Notification Create Failed]', notificationErr.message);
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    NGO starts pickup (live tracking activated, status 'on the way')
// @route   PATCH /api/v1/donations/:id/start-pickup
// @access  Private (NGO / Recipient only)
export const startPickupDonation = async (req, res, next) => {
  try {
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can start pickup.', 403));
    }

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone');

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    const isAcceptedNGO = (donation.acceptedBy && donation.acceptedBy.toString() === req.user.id) ||
                          (donation.claimedBy && donation.claimedBy.toString() === req.user.id);
    if (!isAcceptedNGO) {
      return next(
        new ErrorResponse('Not authorized. Only the NGO that accepted the donation can start pickup', 403)
      );
    }

    if (donation.status !== 'claimed' && donation.status !== 'accepted') {
      return next(
        new ErrorResponse(
          `Cannot start pickup. Current status is '${donation.status}' (expected 'claimed' or 'accepted')`,
          400
        )
      );
    }

    donation.status = 'on the way';
    donation.liveTracking = {
      isActive: true,
      ngoLatitude: req.user.location?.coordinates?.[1] || null,
      ngoLongitude: req.user.location?.coordinates?.[0] || null,
      lastUpdated: new Date(),
    };

    donation.statusHistory.push({
      status: 'on the way',
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    await donation.save({ validateBeforeSave: false });

    notifyDonorStartPickup(donation, req.user.name);

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark donation as Picked Up (NGO who accepted only)
// @route   PATCH /api/v1/donations/:id/pickup
// @access  Private (NGO / Recipient only)
export const pickupDonation = async (req, res, next) => {
  try {
    // Check if NGO is verified
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can pick up donations.', 403));
    }

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone');

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if the user is the NGO that accepted this donation
    const isAcceptedNGO = (donation.acceptedBy && donation.acceptedBy.toString() === req.user.id) ||
                          (donation.claimedBy && donation.claimedBy.toString() === req.user.id);
    if (!isAcceptedNGO) {
      return next(
        new ErrorResponse('Not authorized. Only the NGO that accepted the donation can pick it up', 403)
      );
    }

    // Business Rule: Status must be Accepted, Claimed, or On The Way
    if (donation.status !== 'accepted' && donation.status !== 'claimed' && donation.status !== 'on the way') {
      return next(
        new ErrorResponse(
          `Cannot mark as Picked Up. Current status is '${donation.status}' (expected 'claimed' or 'on the way')`,
          400
        )
      );
    }

    donation.status = 'picked up';
    donation.liveTracking.isActive = false;
    donation.statusHistory.push({
      status: 'picked up',
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    await donation.save({ validateBeforeSave: false });

    // Send pickup status update email to donor (non-blocking)
    sendPickupEmail(donation, donation.donor, req.user);

    // Notify donor via real-time sockets
    notifyDonorDonationPickedUp(donation, req.user.name);

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark donation as Delivered (NGO who accepted only)
// @route   PATCH /api/v1/donations/:id/deliver
// @access  Private (NGO / Recipient only)
export const deliverDonation = async (req, res, next) => {
  try {
    // Check if NGO is verified
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can mark donations as delivered.', 403));
    }

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('claimedBy', 'name email phone');

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if the user is the NGO that accepted this donation
    const isAcceptedNGO = (donation.acceptedBy && donation.acceptedBy.toString() === req.user.id) ||
                          (donation.claimedBy && donation.claimedBy.toString() === req.user.id);
    if (!isAcceptedNGO) {
      return next(
        new ErrorResponse('Not authorized. Only the NGO that accepted the donation can mark it as delivered', 403)
      );
    }

    // Business Rule: Status must be Picked Up
    if (donation.status !== 'picked up') {
      return next(
        new ErrorResponse(
          `Cannot mark as Delivered. Current status is '${donation.status}' (expected 'picked up')`,
          400
        )
      );
    }

    donation.status = 'delivered';
    donation.liveTracking.isActive = false;
    donation.statusHistory.push({
      status: 'delivered',
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    await donation.save({ validateBeforeSave: false });

    // Send delivery confirmation email to donor (non-blocking)
    sendDeliveredEmail(donation, donation.donor, req.user);

    // Notify donor via real-time sockets
    notifyDonorDonationDelivered(donation, req.user.name);

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Find nearby active food donations with distance calculation
// @route   GET /api/v1/donations/nearby
// @access  Public
export const getNearbyDonations = async (req, res, next) => {
  try {
    await checkExpiredDonations();

    const { category, search, page = 1, limit = 10, pincode: queryPincode } = req.query;

    const currentDate = new Date();

    // Filter only active (pending) and non-expired donations
    const matchQuery = { 
      status: 'pending',
      expiryDate: { $gt: currentDate }
    };

    const pincode = req.user?.pincode || queryPincode;
    if (pincode) {
      matchQuery.pincode = pincode;
    } else if (req.user && (req.user.role === 'ngo' || req.user.role === 'recipient')) {
      matchQuery.pincode = req.user.pincode;
    }

    console.log("TRACE BACKEND: NGO pincode:", req.user?.pincode, "Role:", req.user?.role);
    console.log("TRACE BACKEND: Mongo query:", JSON.stringify(matchQuery));

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Aggregation matching strictly by pincode instead of coordinates proximity ($geoNear)
    const aggregationResult = await Donation.aggregate([
      {
        $match: matchQuery,
      },
      {
        $addFields: {
          timeRemaining: { $subtract: ['$expiryDate', currentDate] },
          distance: 0 // Mock distance as geospatial matching is disabled
        }
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            {
              $lookup: {
                from: 'users',
                localField: 'donor',
                foreignField: '_id',
                as: 'donorInfo',
              },
            },
            {
              $unwind: '$donorInfo',
            },
            {
              $project: {
                foodName: 1,
                category: 1,
                quantity: 1,
                description: 1,
                expiryDate: 1,
                pickupTime: 1,
                pincode: 1,
                location: {
                  coordinates: '$location.coordinates',
                  address: 'Address hidden until accepted'
                },
                images: 1,
                status: 1,
                createdAt: 1,
                distance: 1,
                timeRemaining: 1,
                'donorInfo.name': 1
              },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skipNum },
            { $limit: limitNum },
          ],
        },
      },
    ]);

    const totalItems = aggregationResult[0]?.metadata[0]?.total || 0;
    const donations = aggregationResult[0]?.data || [];
    const totalPages = Math.ceil(totalItems / limitNum);

    console.log("TRACE BACKEND: Query result count:", donations.length);
    donations.forEach((d, idx) => {
      console.log(`TRACE BACKEND: Result [${idx}] - Donation pincode: ${d.pincode}, Food Name: ${d.foodName}, Status: ${d.status}`);
    });

    const responsePayload = {
      success: true,
      count: donations.length,
      totalItems,
      totalPages,
      page: pageNum,
      donations,
    };
    console.log("TRACE BACKEND: API response payload:", JSON.stringify(responsePayload));

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get stats for NGO dashboard
// @route   GET /api/v1/donations/ngo/stats
// @access  Private (NGO only)
export const getNGOStats = async (req, res, next) => {
  try {
    await checkExpiredDonations();

    const ngoId = req.user.id;
    const pincode = req.user.pincode;

    let nearbyDonations = 0;
    let expiredNearbyDonations = 0;

    const currentDate = new Date();

    if (pincode) {
      // Count active (pending) and non-expired donations in the same PIN code
      nearbyDonations = await Donation.countDocuments({
        status: 'pending',
        pincode,
        expiryDate: { $gt: currentDate },
      });

      // Count expired pending donations in the same PIN code
      expiredNearbyDonations = await Donation.countDocuments({
        status: 'pending',
        pincode,
        expiryDate: { $lte: currentDate },
      });
    }

    // Counts for this specific NGO
    const acceptedDonations = await Donation.countDocuments({
      $or: [{ acceptedBy: ngoId }, { claimedBy: ngoId }],
      status: { $in: ['accepted', 'claimed', 'on the way', 'picked up', 'picked_up', 'delivered', 'completed', 'expired'] }
    });
    const pendingPickups = await Donation.countDocuments({
      $or: [{ acceptedBy: ngoId }, { claimedBy: ngoId }],
      status: { $in: ['accepted', 'claimed', 'on the way'] }
    });
    const completedDeliveries = await Donation.countDocuments({
      $or: [{ acceptedBy: ngoId }, { claimedBy: ngoId }],
      status: { $in: ['picked up', 'picked_up', 'delivered', 'completed'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        nearbyDonations,
        acceptedDonations,
        claimedDonations: acceptedDonations,
        pendingPickups,
        completedDeliveries,
        deliveriesCompleted: completedDeliveries,
        expiredNearbyDonations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donations accepted by the current NGO
// @route   GET /api/v1/donations/ngo/accepted
// @access  Private (NGO only)
export const getAcceptedDonations = async (req, res, next) => {
  try {
    const ngoId = req.user.id;
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { acceptedBy: ngoId },
        { claimedBy: ngoId }
      ]
    };

    if (status) {
      if (status === 'claimed') {
        query.status = { $in: ['claimed', 'accepted', 'on the way'] };
      } else {
        query.status = status;
      }
    } else {
      query.status = { $in: ['accepted', 'claimed', 'on the way', 'picked up', 'delivered'] };
    }

    if (search) {
      query.foodName = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await Donation.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const donations = await Donation.find(query)
      .populate('donor', 'name phone email')
      .populate('claimedBy', 'name phone email')
      .populate('acceptedBy', 'name phone email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      page: pageNum,
      totalPages,
      totalItems,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel claim/acceptance of a donation (NGO only, before pickup starts)
// @route   PATCH /api/v1/donations/:id/cancel-claim
// @access  Private (NGO / Recipient only)
export const cancelClaimDonation = async (req, res, next) => {
  try {
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can cancel claims.', 403));
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if the user is the NGO that accepted this donation
    const isAcceptedNGO = (donation.acceptedBy && donation.acceptedBy.toString() === req.user.id) ||
                          (donation.claimedBy && donation.claimedBy.toString() === req.user.id);
    if (!isAcceptedNGO) {
      return next(
        new ErrorResponse('Not authorized. Only the NGO that claimed the donation can cancel it', 403)
      );
    }

    // Can only cancel before pickup starts (i.e. status is claimed or accepted)
    if (donation.status !== 'claimed' && donation.status !== 'accepted') {
      return next(
        new ErrorResponse(
          `Cannot cancel claim. Pickup has already started or donation is in status '${donation.status}'`,
          400
        )
      );
    }

    donation.status = 'pending';
    donation.acceptedBy = null;
    donation.claimedBy = null;
    donation.claimedAt = null;

    donation.statusHistory.push({
      status: 'pending',
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    await donation.save({ validateBeforeSave: false });

    // Create database notification for donor
    const NotificationModel = mongoose.model('Notification');
    await NotificationModel.create({
      user: donation.donor,
      title: 'Claim Cancelled',
      message: `The claim on your donation "${donation.foodName}" has been cancelled by ${req.user.name}. It is now back to pending.`,
      type: 'claim_cancelled',
    });

    // Notify donor via socket
    notifyDonorClaimCancelled(donation, req.user.name);

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback/rating for a donation (NGO only, after picked up/delivered)
// @route   PATCH /api/v1/donations/:id/feedback
// @access  Private (NGO / Recipient only)
export const submitDonationFeedback = async (req, res, next) => {
  try {
    if (req.user.role === 'ngo' && !req.user.isVerifiedNGO) {
      return next(new ErrorResponse('Not authorized. Only verified NGOs can submit feedback.', 403));
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
    }

    // Check if the user is the NGO that accepted this donation
    const isAcceptedNGO = (donation.acceptedBy && donation.acceptedBy.toString() === req.user.id) ||
                          (donation.claimedBy && donation.claimedBy.toString() === req.user.id);
    if (!isAcceptedNGO) {
      return next(
        new ErrorResponse('Not authorized. Only the NGO that claimed the donation can submit feedback', 403)
      );
    }

    // Business Rule: Donation status must be 'picked up' or 'delivered'
    if (donation.status !== 'picked up' && donation.status !== 'picked_up' && donation.status !== 'delivered') {
      return next(
        new ErrorResponse(
          `Cannot submit feedback. Feedback can only be submitted after status is marked 'picked up' (current status: '${donation.status}')`,
          400
        )
      );
    }

    // Check if feedback is already submitted
    if (donation.feedback && donation.feedback.rating) {
      return next(new ErrorResponse('Feedback has already been submitted for this donation', 400));
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return next(new ErrorResponse('Please provide a rating between 1 and 5', 400));
    }

    donation.feedback = {
      rating: Number(rating),
      comment: comment || '',
      submittedAt: new Date(),
    };

    await donation.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

