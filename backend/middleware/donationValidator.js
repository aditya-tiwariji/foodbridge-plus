import { body } from 'express-validator';
import { validateRequest } from './validatorMiddleware.js';

export const donationValidationRules = [
  body('foodName')
    .trim()
    .notEmpty()
    .withMessage('Food name is required')
    .isLength({ max: 100 })
    .withMessage('Food name cannot exceed 100 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['veg', 'non-veg', 'dairy', 'bakery', 'cooked meals', 'groceries', 'other'])
    .withMessage('Invalid food category'),

  body('quantity')
    .trim()
    .notEmpty()
    .withMessage('Quantity description is required'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone number is required'),

  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date format')
    .custom((value) => {
      const expiry = new Date(value);
      if (expiry <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),

  body('pickupTime')
    .trim()
    .notEmpty()
    .withMessage('Pickup time instructions are required'),

  body('location.address')
    .notEmpty()
    .withMessage('Location address is required'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]')
    .custom((value) => {
      const [lng, lat] = value;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error('Invalid longitude or latitude values');
      }
      return true;
    }),

  validateRequest,
];
