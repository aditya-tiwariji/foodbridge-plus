// Custom Error Class to set HTTP Status Code along with Error Message
export class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev environment
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    let message = 'Something went wrong. Please try again.';
    if (req.originalUrl.includes('/users/profile')) {
      message = 'Unable to update profile';
    } else if (req.originalUrl.includes('/donations') && req.method === 'DELETE') {
      message = 'Unable to delete donation';
    }
    error = new ErrorResponse(message, 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    let message = 'Something went wrong. Please try again.';
    if (req.originalUrl.includes('/auth/register') || req.originalUrl.includes('/auth/login')) {
      message = 'Invalid credentials';
    } else if (req.originalUrl.includes('/users/profile')) {
      message = 'Unable to update profile';
    }
    error = new ErrorResponse(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    let message = Object.values(err.errors).map((val) => val.message).join(', ');
    if (req.originalUrl.includes('/users/profile')) {
      if (message.toLowerCase().includes('pin') || message.toLowerCase().includes('pincode')) {
        message = 'Invalid PIN code';
      } else {
        message = 'Unable to update profile';
      }
    } else if (req.originalUrl.includes('/auth/register') || req.originalUrl.includes('/auth/login')) {
      message = 'Invalid credentials';
    } else if (req.originalUrl.includes('/donations') && req.method === 'DELETE') {
      message = 'Unable to delete donation';
    } else {
      message = 'Something went wrong. Please try again.';
    }
    error = new ErrorResponse(message, 400);
  }

  // express-validator / custom validation HTTP 400 errors
  if (err.statusCode === 400 || error.statusCode === 400) {
    let message = err.message;
    if (req.originalUrl.includes('/users/profile')) {
      if (message.toLowerCase().includes('pin') || message.toLowerCase().includes('pincode')) {
        message = 'Invalid PIN code';
      } else {
        message = 'Unable to update profile';
      }
      error = new ErrorResponse(message, 400);
    } else if (req.originalUrl.includes('/auth/register') || req.originalUrl.includes('/auth/login')) {
      message = 'Invalid credentials';
      error = new ErrorResponse(message, 400);
    } else if (req.originalUrl.includes('/donations') && req.method === 'DELETE') {
      message = 'Unable to delete donation';
      error = new ErrorResponse(message, 400);
    }
  }

  // MongoDB generic errors (e.g. MongoError)
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    let message = 'Something went wrong. Please try again.';
    if (req.originalUrl.includes('/users/profile')) {
      message = 'Unable to update profile';
    } else if (req.originalUrl.includes('/donations') && req.method === 'DELETE') {
      message = 'Unable to delete donation';
    }
    error = new ErrorResponse(message, 500);
  }

  // JWT Verification Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized to access this resource. Invalid token.';
    error = new ErrorResponse(message, 401);
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = 'Session expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: process.env.NODE_ENV === 'production' ? message : (err.stack || message),
  });
};

// Route NotFound Middleware
export const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};
