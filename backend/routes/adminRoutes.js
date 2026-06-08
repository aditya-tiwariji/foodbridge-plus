import express from 'express';
import {
  getUsers,
  suspendUser,
  activateUser,
  getNGORequests,
  verifyNGO,
  getDonations,
  deleteDonation,
  getAdminStats,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Guard all admin routes with auth protection and admin restriction
router.use(protect);
router.use(adminOnly);

router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.get('/ngos/requests', getNGORequests);
router.put('/ngos/:id/verify', verifyNGO);
router.get('/donations', getDonations);
router.delete('/donations/:id', deleteDonation);
router.get('/stats', getAdminStats);

export default router;
