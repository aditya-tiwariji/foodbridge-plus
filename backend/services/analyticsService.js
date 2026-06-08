import mongoose from 'mongoose';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import { MEALS_MULTIPLIER } from '../config/analyticsConfig.js';

const COMPLETED_STATUSES = ['picked up', 'picked_up', 'delivered', 'completed'];

// Regex helper to parse quantity number from string description (e.g. "10 kg", "2.5 plates")
const parseQuantity = (quantityStr) => {
  if (!quantityStr) return 0;
  const match = quantityStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[0]) : 1;
};

// Generates an array of last 12 months with labels and query keys
const getLast12Months = () => {
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    const label = `${monthNames[monthIndex]} ${year}`;
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    months.push({
      label,
      year,
      month: monthIndex + 1,
      key
    });
  }
  return months;
};

// Format monthly aggregation outputs matching generated date array keys
const formatMonthlyTrend = (trendData, dateList, dateField = 'createdAt') => {
  const trendMap = {};
  trendData.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    trendMap[key] = item.count;
  });
  
  return dateList.map((d) => ({
    name: d.label,
    count: trendMap[d.key] || 0
  }));
};

/**
 * Platform-wide analytics for administration overview
 */
export const getAdminAnalytics = async () => {
  // 1. User counters
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const totalDonors = await User.countDocuments({ role: 'donor' });
  const totalNGOs = await User.countDocuments({ role: 'ngo' });
  const verifiedNGOs = await User.countDocuments({ role: 'ngo', isVerifiedNGO: true });
  const totalRecipients = await User.countDocuments({ role: 'recipient' });

  // 2. Donation counters
  const totalDonations = await Donation.countDocuments();
  const pendingDonations = await Donation.countDocuments({ status: 'pending' });
  const acceptedDonations = await Donation.countDocuments({ status: { $in: ['accepted', 'claimed', 'on the way'] } });
  const pickedUpDonations = await Donation.countDocuments({ status: { $in: COMPLETED_STATUSES } });
  const deliveredDonations = pickedUpDonations;
  const expiredDonations = await Donation.countDocuments({ status: 'expired' });

  // Active definition: pending or accepted (picked up is completed/delivered)
  const activeDonations = pendingDonations + acceptedDonations;

  // 3. Impact Metrics
  // Delivery Success Rate
  const successRate = totalDonations > 0 ? (deliveredDonations / totalDonations) * 100 : 0;

  // Total Food quantity and Meals served
  // We scan and sum completed/delivered donation quantities for meals served, and all donation quantities for total food quantity
  const allDonationQuantities = await Donation.find({}, 'quantity status');
  let totalFoodQuantitySum = 0;
  let deliveredFoodQuantitySum = 0;

  allDonationQuantities.forEach((d) => {
    const qty = parseQuantity(d.quantity);
    totalFoodQuantitySum += qty;
    if (COMPLETED_STATUSES.includes(d.status)) {
      deliveredFoodQuantitySum += qty;
    }
  });

  const estimatedMealsServed = deliveredFoodQuantitySum * MEALS_MULTIPLIER;

  // 4. Monthly trends (last 12 months)
  const months = getLast12Months();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Donations monthly trend
  const donationsTrendRaw = await Donation.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  const donationsTrend = formatMonthlyTrend(donationsTrendRaw, months);

  // Deliveries monthly trend
  const deliveriesTrendRaw = await Donation.aggregate([
    {
      $match: {
        status: { $in: COMPLETED_STATUSES },
        updatedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  const deliveriesTrend = formatMonthlyTrend(deliveriesTrendRaw, months);

  // User growth trend
  const usersTrendRaw = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  const usersTrend = formatMonthlyTrend(usersTrendRaw, months);

  // 5. Category Distribution
  const categoryDistribution = await Donation.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        value: '$count',
        _id: 0
      }
    }
  ]);

  // 6. Donation Status Distribution
  const statusDistribution = await Donation.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        value: '$count',
        _id: 0
      }
    }
  ]);

  // 7. Top Donor Leaderboard (Top 10)
  const topDonors = await Donation.aggregate([
    {
      $group: {
        _id: '$donor',
        donationsCreated: { $sum: 1 },
        successfulDeliveries: {
          $sum: { $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, 1, 0] }
        }
      }
    },
    { $sort: { donationsCreated: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'donorInfo'
      }
    },
    { $unwind: { path: '$donorInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$donorInfo.name', 'Anonymous Donor'] },
        email: { $ifNull: ['$donorInfo.email', 'N/A'] },
        donationsCreated: 1,
        successfulDeliveries: 1
      }
    }
  ]);

  // 8. Top NGO Leaderboard (Top 10)
  const topNGOs = await Donation.aggregate([
    {
      $match: {
        acceptedBy: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$acceptedBy',
        donationsClaimed: { $sum: 1 },
        deliveriesCompleted: {
          $sum: { $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, 1, 0] }
        }
      }
    },
    { $sort: { donationsClaimed: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'ngoInfo'
      }
    },
    { $unwind: { path: '$ngoInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$ngoInfo.name', 'Anonymous NGO'] },
        email: { $ifNull: ['$ngoInfo.email', 'N/A'] },
        donationsClaimed: 1,
        deliveriesCompleted: 1
      }
    }
  ]);

  return {
    metrics: {
      users: {
        total: totalUsers,
        active: activeUsers,
        donors: totalDonors,
        ngos: totalNGOs,
        verifiedNGOs,
        recipients: totalRecipients
      },
      donations: {
        total: totalDonations,
        active: activeDonations,
        pending: pendingDonations,
        accepted: acceptedDonations,
        pickedUp: pickedUpDonations,
        delivered: deliveredDonations,
        expired: expiredDonations
      },
      impact: {
        totalFoodDonations: totalFoodQuantitySum,
        totalSuccessfulDeliveries: deliveredDonations,
        deliverySuccessRate: successRate,
        estimatedMealsServed
      }
    },
    trends: {
      donationsTrend,
      deliveriesTrend,
      usersTrend
    },
    distributions: {
      categoryDistribution,
      statusDistribution
    },
    leaderboards: {
      topDonors,
      topNGOs
    }
  };
};

/**
 * Analytics for a specific donor
 */
export const getDonorAnalytics = async (donorId) => {
  const donorObjId = new mongoose.Types.ObjectId(donorId);

  // 1. Counters
  const totalDonations = await Donation.countDocuments({ donor: donorObjId, status: { $ne: 'deleted' } });
  const pendingDonations = await Donation.countDocuments({ donor: donorObjId, status: 'pending' });
  const acceptedDonations = await Donation.countDocuments({ donor: donorObjId, status: { $in: ['accepted', 'claimed', 'on the way'] } });
  const pickedUpDonations = await Donation.countDocuments({ donor: donorObjId, status: { $in: COMPLETED_STATUSES } });
  const deliveredDonations = pickedUpDonations;
  const expiredDonations = await Donation.countDocuments({ donor: donorObjId, status: 'expired' });

  const activeDonations = pendingDonations + acceptedDonations;
  const successRate = totalDonations > 0 ? (pickedUpDonations / totalDonations) * 100 : 0;

  // 2. Quantity sums & Meals served
  const donorDonations = await Donation.find({ donor: donorObjId, status: { $in: COMPLETED_STATUSES } }, 'quantity');
  let pickedUpQty = 0;
  donorDonations.forEach((d) => {
    pickedUpQty += parseQuantity(d.quantity);
  });
  const mealsContributed = pickedUpQty;

  // 3. Feedback average rating
  const feedbackDonations = await Donation.find({
    donor: donorObjId,
    status: { $in: COMPLETED_STATUSES },
    'feedback.rating': { $ne: null }
  });

  let avgRating = null;
  if (feedbackDonations.length > 0) {
    const sumRatings = feedbackDonations.reduce((sum, d) => sum + d.feedback.rating, 0);
    avgRating = parseFloat((sumRatings / feedbackDonations.length).toFixed(1));
  }

  // 3. Monthly donation trend (last 6 months)
  const months = getLast12Months().slice(-6); // Last 6 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const monthlyTrendRaw = await Donation.aggregate([
    {
      $match: {
        donor: donorObjId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  const monthlyTrend = formatMonthlyTrend(monthlyTrendRaw, months);

  // 4. Category breakdown
  const categoryDistribution = await Donation.aggregate([
    {
      $match: { donor: donorObjId }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        value: '$count',
        _id: 0
      }
    }
  ]);

  return {
    metrics: {
      totalDonations,
      activeDonations,
      deliveredDonations,
      expiredDonations,
      successRate,
      mealsContributed,
      avgRating
    },
    monthlyTrend,
    categoryDistribution
  };
};

/**
 * Analytics for a specific NGO
 */
export const getNGOAnalytics = async (ngoId) => {
  const ngoObjId = new mongoose.Types.ObjectId(ngoId);

  // NGO interacts with acceptedBy or claimedBy
  const claimedDonations = await Donation.countDocuments({
    $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
    status: { $in: ['accepted', 'claimed', 'on the way', 'picked up', 'picked_up', 'delivered', 'completed', 'expired'] }
  });
  const pendingPickups = await Donation.countDocuments({
    $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
    status: { $in: ['accepted', 'claimed', 'on the way'] }
  });
  const inTransit = 0;
  const deliveriesCompleted = await Donation.countDocuments({
    $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
    status: { $in: COMPLETED_STATUSES }
  });

  const completionRate = claimedDonations > 0 ? (deliveriesCompleted / claimedDonations) * 100 : 0;

  // Calculate average response time in minutes
  const claimedList = await Donation.find({
    $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
    claimedAt: { $ne: null }
  }, 'createdAt claimedAt');

  let totalDiffMins = 0;
  let count = 0;
  claimedList.forEach(d => {
    if (d.claimedAt && d.createdAt) {
      const diffMs = d.claimedAt.getTime() - d.createdAt.getTime();
      const diffMins = diffMs / (1000 * 60);
      totalDiffMins += diffMins;
      count++;
    }
  });
  const avgResponseTime = count > 0 ? Math.round(totalDiffMins / count) : 0;

  // 1. Quantity distributed & Meals served
  const ngoDonations = await Donation.find({
    $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
    status: { $in: COMPLETED_STATUSES }
  }, 'quantity');
  let deliveredQty = 0;
  ngoDonations.forEach((d) => {
    deliveredQty += parseQuantity(d.quantity);
  });
  const mealsDistributed = deliveredQty;

  // 2. Monthly deliveries completed trend (last 6 months)
  const months = getLast12Months().slice(-6); // Last 6 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const monthlyCompletionsRaw = await Donation.aggregate([
    {
      $match: {
        $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }],
        status: { $in: COMPLETED_STATUSES },
        updatedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  const monthlyCompletionsTrend = formatMonthlyTrend(monthlyCompletionsRaw, months);

  // 3. Category distribution
  const categoryDistribution = await Donation.aggregate([
    {
      $match: {
        $or: [{ acceptedBy: ngoObjId }, { claimedBy: ngoObjId }]
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: '$_id',
        value: '$count',
        _id: 0
      }
    }
  ]);

  return {
    metrics: {
      claimedDonations,
      pendingPickups,
      inTransit,
      deliveriesCompleted,
      completionRate,
      mealsDistributed,
      avgResponseTime
    },
    monthlyTrend: monthlyCompletionsTrend,
    categoryDistribution
  };
};
