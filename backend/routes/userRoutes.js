import express from 'express';
import { body } from 'express-validator';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfileImage, handleUploadErrors } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Route validation schemas
const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(?:\+91|0)?[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  body('address').optional().trim().notEmpty().withMessage('Address is required'),
  body('pincode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('PIN code is required')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit PIN code'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
];

// All user management routes require JWT authentication
router.use(protect);

router.get('/profile', getUserProfile);

router.put(
  '/profile',
  uploadProfileImage,
  handleUploadErrors,
  updateProfileRules,
  validateRequest,
  updateUserProfile
);

router.put('/change-password', changePasswordRules, validateRequest, changePassword);

export default router;
