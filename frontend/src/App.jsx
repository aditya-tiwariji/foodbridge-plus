import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ForgotPassword from './pages/Login/ForgotPassword.jsx';
import ResetPassword from './pages/Login/ResetPassword.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import DashboardPlaceholder from './pages/DashboardPlaceholder.jsx';
import Profile from './pages/Profile/Profile.jsx';
import EditProfile from './pages/Profile/EditProfile.jsx';
import CreateDonation from './pages/Donations/CreateDonation.jsx';
import MyDonations from './pages/Donations/MyDonations.jsx';
import DonationDetails from './pages/Donations/DonationDetails.jsx';
import EditDonation from './pages/Donations/EditDonation.jsx';

// NGO Pages
import NgoDashboard from './pages/NGO/Dashboard.jsx';
import NgoNearbyDonations from './pages/NGO/NearbyDonations.jsx';
import NgoDonationDetails from './pages/NGO/DonationDetails.jsx';
import NgoAcceptedDonations from './pages/NGO/AcceptedDonations.jsx';
import NgoPickupManagement from './pages/NGO/PickupManagement.jsx';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import NGOManagement from './pages/Admin/NGOManagement.jsx';
import DonationManagement from './pages/Admin/DonationManagement.jsx';
import NotificationManagement from './pages/Admin/NotificationManagement.jsx';
import AnalyticsDashboard from './pages/Admin/AnalyticsDashboard.jsx';

// Donor Analytics
import DonorAnalytics from './pages/Donations/DonorAnalytics.jsx';

// NGO Analytics
import NGOAnalytics from './pages/NGO/NGOAnalytics.jsx';

import { ProtectedRoute, PublicRoute, RoleRoute } from './routes/guards.jsx';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          
          {/* Authenticated Public Routes (Redirect if logged in) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Donor Routes */}
          <Route
            path="/donations"
            element={
              <RoleRoute allowedRoles={['donor']}>
                <MyDonations />
              </RoleRoute>
            }
          />
          <Route
            path="/donations/create"
            element={
              <RoleRoute allowedRoles={['donor']}>
                <CreateDonation />
              </RoleRoute>
            }
          />
          <Route
            path="/donations/:id"
            element={
              <ProtectedRoute>
                <DonationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations/:id/edit"
            element={
              <RoleRoute allowedRoles={['donor']}>
                <EditDonation />
              </RoleRoute>
            }
          />

          {/* NGO Routes */}
          <Route
            path="/ngo/dashboard"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NgoDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/ngo/nearby"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NgoNearbyDonations />
              </RoleRoute>
            }
          />
          <Route
            path="/ngo/donations/:id"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NgoDonationDetails />
              </RoleRoute>
            }
          />
          <Route
            path="/ngo/accepted"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NgoAcceptedDonations />
              </RoleRoute>
            }
          />
          <Route
            path="/ngo/pickups"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NgoPickupManagement />
              </RoleRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <UserManagement />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/ngos"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <NGOManagement />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/donations"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DonationManagement />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AnalyticsDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/donor/analytics"
            element={
              <RoleRoute allowedRoles={['donor']}>
                <DonorAnalytics />
              </RoleRoute>
            }
          />
          <Route
            path="/ngo/analytics"
            element={
              <RoleRoute allowedRoles={['ngo', 'recipient']}>
                <NGOAnalytics />
              </RoleRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationManagement />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
