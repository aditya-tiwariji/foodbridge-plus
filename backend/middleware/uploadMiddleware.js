import multer from 'multer';
import { ErrorResponse } from './errorMiddleware.js';

// Setup multer memory storage to buffer files in RAM
const storage = multer.memoryStorage();

// File filter validator for allowed MIME formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        `Invalid file type (${file.mimetype}). Only JPG, JPEG, PNG, and WEBP formats are allowed.`,
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size per image
  },
  fileFilter,
});

// Multer upload hook expecting 'images' field name and capping count at 5 files
export const uploadDonationImages = upload.array('images', 5);

// Multer upload hook expecting 'profileImage' field name for a single image upload
export const uploadProfileImage = upload.single('profileImage');

// Error interception middleware to translate Multer limits into clean HTTP responses
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('File is too large. Maximum size allowed is 5MB per image.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ErrorResponse('Too many files uploaded. A maximum of 5 images is allowed.', 400));
    }
    return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
  }
  
  if (err) {
    return next(err);
  }
  
  next();
};

// Middleware to parse fields like location from JSON string representations when using multipart/form-data
export const parseMultipartDonation = (req, res, next) => {
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (error) {
      return next(new ErrorResponse('Invalid location format. Expected a valid JSON object string.', 400));
    }
  }
  next();
};
