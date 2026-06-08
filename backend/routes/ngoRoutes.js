import express from 'express';
import { getNearbyNGOs } from '../controllers/ngoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Geospatial search routes require user authentication
router.use(protect);

router.get('/nearby', getNearbyNGOs);

export default router;
