import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getSocketsByUserId } from './socketRegistry.js';

let ioInstance = null;

/**
 * Helper to calculate straight line distance in km between two coordinate arrays
 * coordinates format: [longitude, latitude]
 */
const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) return null;
  const R = 6371; // Earth radius in km
  const lon1 = coords1[0] * Math.PI / 180;
  const lat1 = coords1[1] * Math.PI / 180;
  const lon2 = coords2[0] * Math.PI / 180;
  const lat2 = coords2[1] * Math.PI / 180;
  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;
  const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Initialize with IO server instance
 */
export const initSocketEvents = (io) => {
  ioInstance = io;
};

/**
 * Notify nearby NGOs about a new surplus food listing
 */
export const notifyNearbyNGOs = async (donation) => {
  if (!ioInstance) return;
  try {
    const pincode = donation.pincode;
    if (!pincode) return;

    // Find active NGOs in the same pincode
    const ngos = await User.find({
      role: { $in: ['ngo', 'recipient'] },
      pincode: pincode,
      isActive: true,
    });

    ngos.forEach((ngo) => {
      const distance = calculateDistance(ngo.location?.coordinates, donation.location?.coordinates);
      const sockets = getSocketsByUserId(ngo._id.toString());
      
      sockets.forEach((socketId) => {
        ioInstance.to(socketId).emit('donation_created', {
          donationId: donation._id,
          foodName: donation.foodName,
          category: donation.category,
          quantity: donation.quantity,
          distance: distance || 0,
        });
      });
    });
  } catch (error) {
    console.error('Error emitting donation_created event:', error.message);
  }
};

/**
 * Notify donor that their listed food drive has been accepted/claimed
 */
export const notifyDonorDonationAccepted = (donation, ngoName) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  // Save notification to database (non-blocking)
  Notification.create({
    user: donorId,
    title: 'Donation Claimed',
    message: `Your donation "${donation.foodName}" has been claimed by ${ngoName}.`,
    type: 'donation_accepted',
  }).catch((err) => console.error('[DB Notification Save Failed]', err.message));

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('donation_accepted', {
      donationId: donation._id,
      foodName: donation.foodName,
      ngoName,
      acceptedAt: new Date(),
    });
  });
};

/**
 * Notify donor that their claimed listing is picked up/collected
 */
export const notifyDonorDonationPickedUp = (donation, ngoName) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('donation_picked_up', {
      donationId: donation._id,
      foodName: donation.foodName,
      ngoName,
      pickedUpAt: new Date(),
    });
  });
};

/**
 * Notify donor that their food drive is successfully delivered
 */
export const notifyDonorDonationDelivered = (donation, ngoName) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  // Save notification to database (non-blocking)
  Notification.create({
    user: donorId,
    title: 'Donation Delivered',
    message: `Your donation "${donation.foodName}" has been successfully delivered by ${ngoName}.`,
    type: 'donation_delivered',
  }).catch((err) => console.error('[DB Notification Save Failed]', err.message));

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('donation_delivered', {
      donationId: donation._id,
      foodName: donation.foodName,
      ngoName,
      deliveredAt: new Date(),
    });
  });
};

/**
 * Reusable system message notifications helper
 */
export const notifySystemMessage = (userId, message, type = 'info') => {
  if (!ioInstance) return;

  const sockets = getSocketsByUserId(userId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('system_notification', {
      message,
      type,
      timestamp: new Date(),
    });
  });
};

/**
 * Notify donor that NGO has started pickup (transit started)
 */
export const notifyDonorStartPickup = (donation, ngoName) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  // Save notification to database (non-blocking)
  Notification.create({
    user: donorId,
    title: 'NGO Started Pickup',
    message: `NGO ${ngoName} has started pickup for your donation "${donation.foodName}".`,
    type: 'donation_transit_started',
  }).catch((err) => console.error('[DB Notification Save Failed]', err.message));

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('donation_transit_started', {
      donationId: donation._id,
      foodName: donation.foodName,
      ngoName,
      startedAt: new Date(),
    });
  });
};

/**
 * Notify donor that NGO cancelled the claim on their donation
 */
export const notifyDonorClaimCancelled = (donation, ngoName) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  // Save notification to database (non-blocking)
  Notification.create({
    user: donorId,
    title: 'Claim Cancelled',
    message: `The claim on your donation "${donation.foodName}" has been cancelled by ${ngoName}. It is now back to pending.`,
    type: 'claim_cancelled',
  }).catch((err) => console.error('[DB Notification Save Failed]', err.message));

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('claim_cancelled', {
      donationId: donation._id,
      foodName: donation.foodName,
      ngoName,
      cancelledAt: new Date(),
    });
  });
};

/**
 * Notify donor that their donation listing has expired
 */
export const notifyDonorDonationExpired = (donation) => {
  if (!ioInstance) return;
  const donorId = donation.donor?._id?.toString() || donation.donor?.toString();
  if (!donorId) return;

  const sockets = getSocketsByUserId(donorId);
  sockets.forEach((socketId) => {
    ioInstance.to(socketId).emit('donation_expired', {
      donationId: donation._id,
      foodName: donation.foodName,
      expiredAt: new Date(),
    });
  });
};

