import { ErrorResponse } from './errorMiddleware.js';

// Route guard to only allow users with the 'admin' role
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to access this route. Admin privileges required.', 403)
    );
  }
  next();
};
