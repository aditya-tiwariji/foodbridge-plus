import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { ArrowLeft, User, Phone, MapPin, Hash, Key, Camera, Save, Lock } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile Details State
  const [details, setDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.location?.address || '',
    pincode: user?.pincode || '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profileImage || '');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErrors, setDetailsErrors] = useState({});

  // Password Change State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Global Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  if (!user) return null;

  // Handle Detail Inputs Changes
  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
    if (detailsErrors[name]) {
      setDetailsErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle Photo Picker Changes
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast('Profile image must be less than 5MB.', 'error');
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Profile Details Update
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validate inputs
    if (!details.name.trim()) errors.name = 'Name is required';
    
    // Indian Phone format validation
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!details.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(details.phone.trim())) {
      errors.phone = 'Invalid Indian mobile format (e.g., 9876543210)';
    }

    // Address validation
    if (!details.address.trim()) errors.address = 'Address is required';

    // 6-digit PIN code validation
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!details.pincode.trim()) {
      errors.pincode = 'PIN Code is required';
    } else if (!pincodeRegex.test(details.pincode.trim())) {
      errors.pincode = 'PIN Code must be a 6-digit Indian postcode (e.g., 799001)';
    }

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      triggerToast('Please correct validation errors', 'error');
      return;
    }

    setDetailsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', details.name.trim());
      formData.append('phone', details.phone.trim());
      formData.append('address', details.address.trim());
      formData.append('pincode', details.pincode.trim());
      
      if (profilePhoto) {
        formData.append('profileImage', profilePhoto);
      }

      console.log('Sending Profile Update request...');
      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        updateUser(response.data.user);
        triggerToast('Profile updated successfully!', 'success');
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed updating profile details:', err);
      triggerToast(err.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!passwords.currentPassword) errors.currentPassword = 'Current password is required';
    
    const newPassword = passwords.newPassword;
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!hasLetter || !hasNumber || !hasSymbol) {
      errors.newPassword = 'Password must contain letters, numbers, and symbols';
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      triggerToast('Please check password input fields', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      console.log('Sending Password Change request...');
      const response = await api.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });

      if (response.data.success) {
        triggerToast('Password changed successfully!', 'success');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({});
      }
    } catch (err) {
      console.error('Failed password update:', err);
      triggerToast(err.message || 'Failed to change password. Please verify current password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PageWrapper className="bg-slate-50 py-10">
      <Container className="max-w-4xl">
        {/* Navigation back and header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Profile
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
            <p className="text-sm text-slate-500">Manage details and credentials</p>
          </div>
        </div>

        {/* Form container - two-column or stacked layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Edit profile details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Card className="shadow-lg border border-slate-100 p-6 bg-white">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Profile Information
              </h2>

              <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-6">
                {/* Photo upload section */}
                <div className="flex items-center gap-6 pb-4 border-b border-slate-100">
                  <div className="relative group">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-2xl border-2 border-slate-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-md transition-colors"
                      aria-label="Upload photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Profile Picture</h3>
                    <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG or WEBP formats. Capped at 5MB.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-bold mt-2 focus:outline-none"
                    >
                      Choose New Photo
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={details.name}
                    onChange={handleDetailsChange}
                    error={detailsErrors.name}
                    placeholder="Enter your full name"
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={details.phone}
                    onChange={handleDetailsChange}
                    error={detailsErrors.phone}
                    placeholder="Enter 10-digit phone number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Physical Address"
                      name="address"
                      value={details.address}
                      onChange={handleDetailsChange}
                      error={detailsErrors.address}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <Input
                      label="PIN Code"
                      name="pincode"
                      value={details.pincode}
                      onChange={handleDetailsChange}
                      error={detailsErrors.pincode}
                      placeholder="6-digit PIN"
                    />
                  </div>
                </div>

                {/* Role field (Read Only) */}
                <div className="flex flex-col gap-1.5 opacity-70">
                  <label className="text-sm font-semibold text-slate-700">Account Role (Read-only)</label>
                  <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium capitalize">
                    {user.role}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={detailsLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" /> Save Profile Details
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Column 3: Change Password section */}
          <div className="flex flex-col gap-8">
            <Card className="shadow-lg border border-slate-100 p-6 bg-white">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary-600" />
                Change Password
              </h2>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                <Input
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={(e) => {
                    setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }));
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                />

                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords((prev) => ({ ...prev, newPassword: e.target.value }));
                    if (passwordErrors.newPassword) {
                      setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  error={passwordErrors.newPassword}
                  placeholder="At least 8 chars, letters, numbers & symbols"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  error={passwordErrors.confirmPassword}
                  placeholder="Verify new password"
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={passwordLoading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Key className="h-4 w-4" /> Change Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>

        {/* Global Toast component mounting */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}
      </Container>
    </PageWrapper>
  );
};

export default EditProfile;
