import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../services/emailService.js';
import { geocodeAddress } from '../services/mapsService.js';

// Helper to generate token and send cookie response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  console.log("JWT GENERATED");

  // Calculate cookie expiration in milliseconds
  const cookieDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 30;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Remove password from response object
  const userResponse = user.toObject();
  delete userResponse.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userResponse,
    });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, pincode, location } = req.body;
    console.log("REGISTER ATTEMPT:", email);

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("REGISTER FAILED: User already exists with email:", email);
      return next(new ErrorResponse('User already exists with this email address', 400));
    }

    const address = location?.address || req.body.address;
    if (!address) {
      return next(new ErrorResponse('Physical address is required.', 400));
    }

    let geoResult;
    try {
      geoResult = await geocodeAddress(address);
    } catch (err) {
      console.error('Registration geocoding failed:', err.message);
      return next(new ErrorResponse(`Geocoding failed for the address "${address}". Please enter a valid, recognizable physical address.`, 400));
    }

    const finalPincode = geoResult.pincode || pincode || req.body.pincode;
    if (!finalPincode) {
      return next(new ErrorResponse('Could not resolve PIN code for this address. Please provide a valid address and PIN code.', 400));
    }

    // Create user in DB with geocoded values
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      pincode: finalPincode,
      location: {
        address: geoResult.formattedAddress || address,
        coordinates: [geoResult.longitude, geoResult.latitude]
      }
    });

    console.log("REGISTER SUCCESS for email:", email);

    // Send welcome email asynchronously (non-blocking)
    sendWelcomeEmail(user);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("LOGIN ATTEMPT", email);

    // Validate email & password inputs
    if (!email || !password) {
      return next(new ErrorResponse('Please provide both an email and password', 400));
    }

    // Check for user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log("LOGIN FAILED: User not found with email:", email);
      return next(new ErrorResponse('No account found with this email', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log("PASSWORD MATCH", isMatch);
    if (!isMatch) {
      console.log("LOGIN FAILED: Incorrect password for email:", email);
      return next(new ErrorResponse('Incorrect password', 401));
    }

    // Check if user is suspended
    if (user.isActive === false) {
      console.log("LOGIN FAILED: Account suspended for email:", email);
      return next(new ErrorResponse('Account suspended. Contact support.', 403));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by protect middleware
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse('Please provide an email address', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('No account found with this email', 404));
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set user fields
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    const resetURL = resetUrl;
    console.log("RESET URL", resetURL);

    console.log(`Sending reset email to: ${user.email} with url: ${resetUrl}`);
    const mailSent = await sendResetPasswordEmail(user, resetUrl);

    if (!mailSent) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Dev Mode] SMTP delivery failed. Access reset link directly from here: ${resetUrl}`);
        return res.status(200).json({
          success: true,
          message: 'Password reset link sent to email (SMTP offline: check server console logs)',
        });
      }
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(new ErrorResponse('Email could not be sent', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const token = req.body.token;
    const newPassword = req.body.password || req.body.newPassword;
    const confirmPassword = req.body.confirmPassword || req.body.password || req.body.newPassword;

    if (!token) {
      return next(new ErrorResponse('Token is required', 400));
    }

    if (!newPassword || !confirmPassword) {
      return next(new ErrorResponse('Please provide both new password and confirmation password', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    if (newPassword.length < 8) {
      return next(new ErrorResponse('Password must be at least 8 characters long', 400));
    }

    // Hash token to search
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password (pre-save hook will hash it automatically)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
