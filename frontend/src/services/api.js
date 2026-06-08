import axios from 'axios';

// Base API URL with fallback to local development port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token into Authorization headers
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Helper to verify if the path requires authentication
const isProtectedPath = (pathname) => {
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/404'];
  if (publicPaths.includes(pathname)) return false;
  
  const protectedPrefixes = ['/dashboard', '/profile', '/donations', '/ngo', '/admin', '/notifications'];
  return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
};

// Response Interceptor: Capture global auth expiry and format errors cleanly
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response Success] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }

    let errorMessage = 'Something went wrong. Please try again.';

    if (!error.response) {
      errorMessage = 'Network connection failed. Please check your internet connection or try again later.';
    } else if (error.response.status === 429) {
      errorMessage = typeof error.response.data === 'string'
        ? error.response.data
        : (error.response.data?.message || 'Too many requests. Please wait a moment and try again.');
    } else if (error.response.status >= 500) {
      errorMessage = 'Internal server error. Our technical team has been notified. Please try again later.';
    } else {
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      if (typeof errorMessage === 'object') {
        errorMessage = errorMessage.message || errorMessage.error || JSON.stringify(errorMessage);
      }
    }

    // If token expired/invalid (401) or user account suspended (403)
    const isUnauthorized = error.response && error.response.status === 401;
    const isSuspended = error.response && error.response.status === 403 && 
      String(errorMessage).toLowerCase().includes('suspended');

    if (isUnauthorized || isSuspended) {
      // Clear token and user profiles from session persistence
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Prevent infinite redirect loops if already on login page or if page is a public page
      if (isProtectedPath(window.location.pathname) && !window.location.pathname.includes('/login')) {
        window.location.href = `/login?${isSuspended ? 'suspended=true' : 'expired=true'}`;
      }
    }
      
    // Re-wrap error details to simplify UI catches
    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.data = error.response?.data;

    return Promise.reject(customError);
  }
);

export default api;
