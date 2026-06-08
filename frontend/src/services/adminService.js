import api from './api.js';

/**
 * Fetch platform overview statistics
 */
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Fetch users list with search, filter, and pagination
 */
export const getUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Suspend user account
 */
export const suspendUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/suspend`);
  return response.data;
};

/**
 * Reactivate suspended user account
 */
export const activateUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/activate`);
  return response.data;
};

/**
 * Fetch NGO verification requests
 */
export const getNGORequests = async (params = {}) => {
  const response = await api.get('/admin/ngos/requests', { params });
  return response.data;
};

/**
 * Approve or Reject NGO verification request
 */
export const verifyNGO = async (ngoId, action) => {
  const response = await api.put(`/admin/ngos/${ngoId}/verify`, { action });
  return response.data;
};

/**
 * Fetch donations for administrative moderation
 */
export const getAdminDonations = async (params = {}) => {
  const response = await api.get('/admin/donations', { params });
  return response.data;
};

/**
 * Moderative delete of a donation listing
 */
export const deleteAdminDonation = async (donationId) => {
  const response = await api.delete(`/admin/donations/${donationId}`);
  return response.data;
};

/**
 * Fetch user-side notifications log
 */
export const getMyNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};
