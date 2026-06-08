import api from './api.js';

/**
 * Fetch platform-wide analytics metrics and trends
 */
export const getAdminAnalytics = async () => {
  const response = await api.get('/analytics/admin');
  return response.data;
};

/**
 * Fetch donor contributions dashboard stats
 */
export const getDonorAnalytics = async () => {
  const response = await api.get('/analytics/donor');
  return response.data;
};

/**
 * Fetch NGO claims and distributions stats
 */
export const getNGOAnalytics = async () => {
  const response = await api.get('/analytics/ngo');
  return response.data;
};

/**
 * Download admin monthly trends report as a CSV file
 */
export const downloadCSVExport = async () => {
  const response = await api.get('/analytics/admin/export', {
    responseType: 'blob'
  });
  return response.data;
};
