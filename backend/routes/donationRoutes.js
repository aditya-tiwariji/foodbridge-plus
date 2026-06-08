import express from 'express';
import {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  acceptDonation,
  pickupDonation,
  deliverDonation,
  getNearbyDonations,
  getNGOStats,
  getAcceptedDonations,
  startPickupDonation,
  cancelClaimDonation,
  submitDonationFeedback,
} from '../controllers/donationController.js';
import { protect, authorize, optionalProtect } from '../middleware/authMiddleware.js';
import { donationValidationRules } from '../middleware/donationValidator.js';
import {
  uploadDonationImages,
  handleUploadErrors,
  parseMultipartDonation,
} from '../middleware/uploadMiddleware.js';

const router = express.Router();

// NGO specific endpoints (MUST be defined before /:id to prevent routing conflict)
router.get('/ngo/stats', protect, authorize('ngo', 'recipient'), getNGOStats);
router.get('/ngo/accepted', protect, authorize('ngo', 'recipient'), getAcceptedDonations);

// Public / optional auth routes
router.get('/', optionalProtect, getDonations);
router.get('/nearby', optionalProtect, getNearbyDonations);
router.get('/:id', optionalProtect, getDonationById);

// Protected routes (Requires Auth)
router.use(protect);

// Donor only routes
router.post(
  '/',
  authorize('donor'),
  uploadDonationImages,
  handleUploadErrors,
  parseMultipartDonation,
  donationValidationRules,
  createDonation
);
router.put(
  '/:id',
  authorize('donor'),
  uploadDonationImages,
  handleUploadErrors,
  parseMultipartDonation,
  donationValidationRules,
  updateDonation
);

// Donor & Admin route
router.delete('/:id', authorize('donor', 'admin'), deleteDonation);

// NGO / Recipient routes
router.patch('/:id/accept', authorize('ngo', 'recipient'), acceptDonation);
router.patch('/:id/cancel-claim', authorize('ngo', 'recipient'), cancelClaimDonation);
router.patch('/:id/start-pickup', authorize('ngo', 'recipient'), startPickupDonation);
router.patch('/:id/pickup', authorize('ngo', 'recipient'), pickupDonation);
router.patch('/:id/deliver', authorize('ngo', 'recipient'), deliverDonation);
router.patch('/:id/feedback', authorize('ngo', 'recipient'), submitDonationFeedback);

export default router;
