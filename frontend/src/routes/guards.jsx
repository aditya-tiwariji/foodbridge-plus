import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/ui/Loader.jsx';

/**
 * Route wrapper that ensures the user is logged in.
 * If not authenticated, redirects to /login.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Route wrapper that enforces user role constraints.
 * If role is not allowed, redirects to /404.
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

/**
 * Route wrapper for public-only auth routes (e.g. login, register).
 * If user is already logged in, redirects to the /dashboard.
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }

  if (isAuthenticated) {
    if (user?.role === 'ngo' || user?.role === 'recipient') {
      return <Navigate to="/ngo/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
