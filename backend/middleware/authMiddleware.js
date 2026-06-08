import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ErrorResponse } from './errorMiddleware.js';

// Protect routes - Verify JWT
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token || token === 'none') {
    return next(new ErrorResponse('Not authorized to access this route. Missing token.', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT VERIFICATION SUCCESS for user ID:", decoded.id);

    // Get user from the token and attach to req
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log("JWT VERIFICATION FAILED: User not found in database for ID:", decoded.id);
      return next(new ErrorResponse('No user found with this token context.', 404));
    }

    // Check if user is suspended
    if (req.user.isActive === false) {
      console.log("JWT VERIFICATION FAILED: Suspended user ID:", decoded.id);
      return next(new ErrorResponse('Your account has been suspended. Please contact administrator.', 403));
    }

    next();
  } catch (error) {
    console.log("JWT VERIFICATION FAILED:", error.message);
    return next(new ErrorResponse('Not authorized to access this route. Invalid token.', 401));
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user?.role || 'guest'}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Optional auth context lookup - Verify JWT but proceed if missing/invalid
export const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
    token = req.cookies.token;
  }

  if (token && token !== 'none') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Continue silently as guest/unauthenticated
    }
  }
  next();
};
