import { validationResult } from 'express-validator';
import { ErrorResponse } from './errorMiddleware.js';

// Middleware to check validation results and handle errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMsg = errors
      .array()
      .map((err) => `${err.path || err.param}: ${err.msg}`)
      .join(' | ');

    return next(new ErrorResponse(errorMsg, 400));
  }
  next();
};
