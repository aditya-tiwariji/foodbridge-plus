import transporter from '../config/mailer.js';
import Notification from '../models/Notification.js';
import {
  getWelcomeTemplate,
  getVerificationTemplate,
  getDonationCreatedTemplate,
  getDonationAcceptedTemplate,
  getPickupTemplate,
  getDeliveryTemplate,
  getNGOApprovedTemplate,
  getNGORejectedTemplate,
} from '../utils/emailTemplates.js';

// Helper to save notifications to database (non-blocking)
const saveNotification = async (userId, title, message, type) => {
  try {
    const allowedTypes = [
      'donation_accepted',
      'donation_transit_started',
      'donation_delivered',
      'donation_expired',
      'claim_cancelled',
    ];
    if (!allowedTypes.includes(type)) {
      return;
    }
    await Notification.create({
      user: userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error(`[Notification Save Failed] User: ${userId} | Error: ${error.message}`);
  }
};

// Private mail delivery helper with robust error handling to prevent API route blocking
const sendMail = async (to, subject, htmlContent) => {
  try {
    const fromAddress = process.env.EMAIL_FROM || '"FoodBridge" <noreply@foodbridge.org>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[Email Sent] MessageId: ${info.messageId} | Recipient: ${to} | Subject: ${subject}`);
    return info;
  } catch (error) {
    console.error(`[Email Failed] Recipient: ${to} | Subject: ${subject} | Error: ${error.message}`);
    // Return null instead of throwing so it does not interrupt parent controller executions
    return null;
  }
};

/**
 * Send welcome email to a new user
 * @param {object} user - User document
 */
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to FoodBridge!';
  const htmlContent = getWelcomeTemplate(user.name, user.role);
  saveNotification(user._id, 'Welcome to FoodBridge!', 'Thank you for registering on our platform.', 'welcome');
  return sendMail(user.email, subject, htmlContent);
};

/**
 * Send account verification email containing a security link
 * @param {object} user - User document
 * @param {string} verificationUrl - Activation link
 */
export const sendVerificationEmail = async (user, verificationUrl) => {
  const subject = 'Verify Your FoodBridge Account';
  const htmlContent = getVerificationTemplate(user.name, verificationUrl);
  saveNotification(user._id, 'Verification Email Sent', 'A verification link has been sent to your email.', 'verification');
  return sendMail(user.email, subject, htmlContent);
};

/**
 * Send confirmation email to a donor that their donation was created
 * @param {object} donation - Donation document
 * @param {object} donor - Donor user document
 */
export const sendDonationCreatedEmail = async (donation, donor) => {
  const subject = `FoodBridge: Donation Listed - ${donation.foodName}`;
  const htmlContent = getDonationCreatedTemplate(donor.name, donation.foodName, donation.quantity);
  saveNotification(
    donor._id || donor,
    'Donation Listed Successfully',
    `Your donation listing for "${donation.foodName}" is now live.`,
    'donation_created'
  );
  return sendMail(donor.email, subject, htmlContent);
};

/**
 * Send claim alert email to a donor when an NGO claims their food
 * @param {object} donation - Donation document
 * @param {object} donor - Donor user document
 * @param {object} ngo - NGO user document
 */
export const sendDonationAcceptedEmail = async (donation, donor, ngo) => {
  const subject = `FoodBridge: Donation Claimed by ${ngo.name}`;
  const htmlContent = getDonationAcceptedTemplate(
    donor.name,
    ngo.name,
    ngo.phone,
    donation.foodName,
    donation.quantity
  );
  return sendMail(donor.email, subject, htmlContent);
};

/**
 * Send pickup notification email to the donor
 * @param {object} donation - Donation document
 * @param {object} donor - Donor user document
 * @param {object} ngo - NGO user document
 */
export const sendPickupEmail = async (donation, donor, ngo) => {
  const subject = `FoodBridge: Donation Picked Up - ${donation.foodName}`;
  const htmlContent = getPickupTemplate(donor.name, ngo.name, donation.foodName);
  return sendMail(donor.email, subject, htmlContent);
};

/**
 * Send delivery completion email to the donor
 * @param {object} donation - Donation document
 * @param {object} donor - Donor user document
 * @param {object} ngo - NGO user document
 */
export const sendDeliveredEmail = async (donation, donor, ngo) => {
  const subject = `FoodBridge: Donation Successfully Delivered!`;
  const htmlContent = getDeliveryTemplate(donor.name, ngo.name, donation.foodName);
  return sendMail(donor.email, subject, htmlContent);
};

/**
 * Send NGO approved email
 * @param {object} user - User document
 */
export const sendNGOVerificationApprovedEmail = async (user) => {
  const subject = 'FoodBridge: NGO Profile Approved!';
  const htmlContent = getNGOApprovedTemplate(user.name);
  saveNotification(user._id, 'NGO Profile Verified', 'Your NGO profile has been verified and approved.', 'ngo_verified');
  return sendMail(user.email, subject, htmlContent);
};

/**
 * Send NGO rejected email
 * @param {object} user - User document
 */
export const sendNGOVerificationRejectedEmail = async (user) => {
  const subject = 'FoodBridge: NGO Profile Verification Update';
  const htmlContent = getNGORejectedTemplate(user.name);
  saveNotification(user._id, 'NGO Profile Verification Update', 'Your NGO verification request has been rejected.', 'ngo_rejected');
  return sendMail(user.email, subject, htmlContent);
};

/**
 * Send password reset email containing a reset link
 * @param {object} user - User document
 * @param {string} resetUrl - Complete password reset link with token
 */
export const sendResetPasswordEmail = async (user, resetUrl) => {
  const subject = 'FoodBridge: Password Reset Request';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800;">FoodBridge</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Food Surplus Redistribution Platform</p>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.6;">We received a request to reset your password for your FoodBridge account. If you did not make this request, you can safely ignore this email.</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px;">To proceed with resetting your password, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">If the button doesn't work, copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #0284c7; margin-bottom: 30px;"><a href="${resetUrl}" style="color: #0284c7; text-decoration: none;">${resetUrl}</a></p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">Please note: This password reset link will expire in <strong>10 minutes</strong> for security reasons.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">FoodBridge &copy; ${new Date().getFullYear()} | Safe Surplus Food Distribution System</p>
    </div>
  `;
  saveNotification(user._id, 'Password Reset Requested', 'A password reset link has been dispatched to your email.', 'password_reset');
  return sendMail(user.email, subject, htmlContent);
};

