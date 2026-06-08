// Base layout wrapper to keep styling consistent across all templates
const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      background-color: #f7f9fa;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e1e8ed;
    }
    .header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background-color: #f1f5f9;
      color: #64748b;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 20px;
      text-align: center;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .details-table td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .details-table td.label {
      font-weight: bold;
      color: #4b5563;
      width: 30%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FoodBridge</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>FoodBridge © 2026. Bridging surplus food to communities in need.</p>
      <p>If you have any questions, contact support@foodbridge.org</p>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeTemplate = (name, role) => {
  return baseLayout(`
    <h2>Welcome to FoodBridge, ${name}!</h2>
    <p>We are thrilled to have you join our community as a <strong>${role.toUpperCase()}</strong>.</p>
    <p>FoodBridge is a platform dedicated to reducing food waste and combatting hunger by directly connecting local food donors (restaurants, hotels, stores) with NGOs and shelter homes.</p>
    <p><strong>Here is what you can do next:</strong></p>
    <ul>
      ${
        role === 'donor'
          ? '<li>List your surplus food items with details, pickup times, and images.</li><li>Track claimed donations and monitor your community impact.</li>'
          : '<li>Browse food donations posted near your location.</li><li>Claim listings and coordinate secure pickups directly with donors.</li>'
      }
      <li>Verify your email profile to establish platform trust.</li>
    </ul>
    <p style="text-align: center;">
      <a href="#" class="button">Go to Dashboard</a>
    </p>
  `);
};

export const getVerificationTemplate = (name, url) => {
  return baseLayout(`
    <h2>Verify Your Email Address</h2>
    <p>Hello ${name},</p>
    <p>Thank you for registering on FoodBridge. Please click the button below to verify your email address and activate your account:</p>
    <p style="text-align: center;">
      <a href="${url}" class="button" target="_blank">Verify Email</a>
    </p>
    <p>If the button doesn't work, you can copy and paste the link below into your browser:</p>
    <p style="word-break: break-all; color: #059669;">${url}</p>
    <p>This verification link will expire in 24 hours.</p>
  `);
};

export const getDonationCreatedTemplate = (donorName, foodName, quantity) => {
  return baseLayout(`
    <h2>Donation Listing Posted Successfully</h2>
    <p>Hello ${donorName},</p>
    <p>Your food donation listing for <strong>${foodName}</strong> is now live on the FoodBridge platform.</p>
    <table class="details-table">
      <tr>
        <td class="label">Item Name</td>
        <td>${foodName}</td>
      </tr>
      <tr>
        <td class="label">Quantity</td>
        <td>${quantity}</td>
      </tr>
      <tr>
        <td class="label">Status</td>
        <td><span style="color:#f59e0b;font-weight:bold;">Pending Claim</span></td>
      </tr>
    </table>
    <p>NGOs in your area have been notified and we will email you as soon as your donation is claimed.</p>
  `);
};

export const getDonationAcceptedTemplate = (donorName, ngoName, ngoPhone, foodName, quantity) => {
  return baseLayout(`
    <h2>Great News! Your Donation was Claimed</h2>
    <p>Hello ${donorName},</p>
    <p>An NGO has accepted your food donation listing: <strong>${foodName}</strong>.</p>
    <h3>Claimant NGO Details:</h3>
    <table class="details-table">
      <tr>
        <td class="label">NGO Name</td>
        <td><strong>${ngoName}</strong></td>
      </tr>
      <tr>
        <td class="label">Contact Phone</td>
        <td>${ngoPhone}</td>
      </tr>
      <tr>
        <td class="label">Food Claimed</td>
        <td>${foodName} (${quantity})</td>
      </tr>
      <tr>
        <td class="label">Current Status</td>
        <td><span style="color:#3b82f6;font-weight:bold;">Accepted (Awaiting Pickup)</span></td>
      </tr>
    </table>
    <p>The NGO representative will contact you shortly using your registered contact details to coordinate the pickup schedule.</p>
  `);
};

export const getPickupTemplate = (donorName, ngoName, foodName) => {
  return baseLayout(`
    <h2>Donation Picked Up</h2>
    <p>Hello ${donorName},</p>
    <p>Your food donation for <strong>${foodName}</strong> has been successfully picked up by <strong>${ngoName}</strong> and is currently in transit.</p>
    <table class="details-table">
      <tr>
        <td class="label">NGO Name</td>
        <td>${ngoName}</td>
      </tr>
      <tr>
        <td class="label">Food Item</td>
        <td>${foodName}</td>
      </tr>
      <tr>
        <td class="label">Status</td>
        <td><span style="color:#8b5cf6;font-weight:bold;">Picked Up / In Transit</span></td>
      </tr>
    </table>
    <p>We will notify you once the NGO confirms that the food has been safely delivered to its destination.</p>
  `);
};

export const getDeliveryTemplate = (donorName, ngoName, foodName) => {
  return baseLayout(`
    <h2>Donation Delivered Successfully!</h2>
    <p>Hello ${donorName},</p>
    <p>We are happy to inform you that your food donation for <strong>${foodName}</strong> has been marked as <strong>Delivered</strong> by <strong>${ngoName}</strong>.</p>
    <table class="details-table">
      <tr>
        <td class="label">NGO Name</td>
        <td>${ngoName}</td>
      </tr>
      <tr>
        <td class="label">Food Item</td>
        <td>${foodName}</td>
      </tr>
      <tr>
        <td class="label">Status</td>
        <td><span style="color:#10b981;font-weight:bold;">Delivered / Completed</span></td>
      </tr>
    </table>
    <p>Thank you for your generous contribution! You have successfully bridged the gap and helped feed those in need in your local community.</p>
  `);
};

export const getNGOApprovedTemplate = (name) => {
  return baseLayout(`
    <h2>NGO Profile Approved!</h2>
    <p>Hello ${name},</p>
    <p>We are pleased to inform you that your NGO profile on FoodBridge has been verified and approved by our administrators.</p>
    <p>You can now log in to access the NGO dashboard, search for nearby food drives, and accept donations to distribute to communities in need.</p>
    <p style="text-align: center;">
      <a href="#" class="button">Go to NGO Dashboard</a>
    </p>
  `);
};

export const getNGORejectedTemplate = (name) => {
  return baseLayout(`
    <h2>NGO Profile Verification Update</h2>
    <p>Hello ${name},</p>
    <p>We regret to inform you that your NGO verification request on FoodBridge has been rejected by our administrators.</p>
    <p>Please ensure that your details, address, and credentials are correct and updated, or contact us at support@foodbridge.org if you believe this was an error.</p>
  `);
};

