import * as analyticsService from '../services/analyticsService.js';

// @desc    Get administrative/platform-wide analytics
// @route   GET /api/v1/analytics/admin
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminAnalytics();
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor-specific analytics
// @route   GET /api/v1/analytics/donor
// @access  Private (Donor only)
export const getDonorStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getDonorAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get NGO-specific analytics
// @route   GET /api/v1/analytics/ngo
// @access  Private (NGO only)
export const getNGOStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getNGOAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export platform monthly activity report as CSV
// @route   GET /api/v1/analytics/admin/export
// @access  Private (Admin only)
export const exportCSV = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminAnalytics();
    
    const donations = data.trends.donationsTrend;
    const deliveries = data.trends.deliveriesTrend;
    const users = data.trends.usersTrend;

    let csvContent = 'Month,Donations Posted,Deliveries Completed,User Registrations\n';
    
    for (let i = 0; i < donations.length; i++) {
      csvContent += `"${donations[i].name}",${donations[i].count},${deliveries[i].count},${users[i].count}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=foodbridge-monthly-impact-report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
