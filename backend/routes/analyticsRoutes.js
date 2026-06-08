import express from 'express';
import {
  getAdminStats,
  getDonorStats,
  getNGOStats,
  exportCSV,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Guard all endpoints under this router with token protection
router.use(protect);

router.get('/admin', adminOnly, getAdminStats);
router.get('/admin/export', adminOnly, exportCSV);
router.get('/donor', authorize('donor'), getDonorStats);
router.get('/ngo', authorize('ngo', 'recipient'), getNGOStats);

export default router;
