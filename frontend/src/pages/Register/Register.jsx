import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';

const Register = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'donor',
      phone: '',
      address: '',
      pincode: '',
    },
  });

  const password = watch('password', '');

  // Calculate password strength rating
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200 w-0' };
    if (pwd.length < 6) return { score: 1, label: 'Too Short', color: 'bg-red-500 w-1/3' };

    let score = 1;
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    if (hasLetters && hasNumbers) score += 1;
    if (hasSpecial) score += 1;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-red-500 w-1/3' };
    if (score === 2) return { score: 2, label: 'Medium', color: 'bg-amber-500 w-2/3' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500 w-full' };
  };

  const strength = getPasswordStrength(password);

  // Geocode address using our backend endpoint, resolving coordinates and auto-filling pincode
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedCoordinates, setResolvedCoordinates] = useState(null);

  const handleAddressLookup = async () => {
    const address = watch('address');
    if (!address || address.trim() === '') return;
    setIsGeocoding(true);
    try {
      const response = await api.post('/location/geocode', { address });
      if (response.data && response.data.success) {
        const { formattedAddress, latitude, longitude, pincode } = response.data;
        setResolvedCoordinates([longitude, latitude]);
        if (pincode) {
          setValue('pincode', pincode);
        }
        setValue('address', formattedAddress);
      }
    } catch (err) {
      console.error('Geocoding error during lookup:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setToast(null);
    try {
      let coordinates = resolvedCoordinates;
      let pincodeVal = data.pincode;

      if (!coordinates) {
        // Fallback geocoding lookup on submit if not already resolved
        try {
          const response = await api.post('/location/geocode', { address: data.address });
          if (response.data && response.data.success) {
            const { latitude, longitude, pincode: fetchedPincode } = response.data;
            coordinates = [longitude, latitude];
            if (!pincodeVal && fetchedPincode) {
              pincodeVal = fetchedPincode;
              setValue('pincode', fetchedPincode);
            }
          }
        } catch (err) {
          console.error('Fallback geocoding failed:', err);
        }
      }

      if (!coordinates) {
        coordinates = [0, 0];
      }

      // Build backend registration payload format
      const signupPayload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        pincode: pincodeVal,
        location: {
          address: data.address,
          coordinates: coordinates,
        },
      };

      const regData = await signup(signupPayload);
      setToast({ message: 'Welcome to FoodBridge+! Registration successful.', type: 'success' });
      
      let redirectRoute = '/dashboard';
      if (regData.role === 'ngo' || regData.role === 'recipient') {
        redirectRoute = '/ngo/dashboard';
      } else if (regData.role === 'admin') {
        redirectRoute = '/admin/dashboard';
      }

      console.log("REDIRECTING TO", redirectRoute);
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate(redirectRoute);
      }, 1000);
    } catch (error) {
      setToast({
        message: error.message || 'Registration failed. Please check your inputs.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'donor', label: 'Food Donor (Restaurant, Hotel, Store)' },
    { value: 'ngo', label: 'NGO / Claimant (Charity, Food Bank)' },
  ];

  return (
    <PageWrapper className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-140px)]">
      <Container className="w-full max-w-lg my-8">
        <Card className="shadow-xl border border-slate-100 p-8 bg-white">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-primary-50 rounded-full text-primary-600 mb-4">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
            <p className="text-slate-500 text-sm mt-1">Join the FoodBridge+ community today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Name Input */}
            <Input
              label="Organization / Display Name"
              type="text"
              placeholder="e.g. Hope Shelter or Bistro Diner"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. contact@domain.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please provide a valid email address',
                },
              })}
            />

            {/* Password Input with Show/Hide toggle and Strength Indicator */}
            <div className="relative w-full">
              <Input
                label="Password (min 6 characters)"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Strength indicator line */}
            {password && (
              <div className="w-full flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Password Strength:</span>
                  <span className="text-slate-700">{strength.label}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} />
                </div>
              </div>
            )}

            {/* Confirm Password Input with Show/Hide toggle */}
            <div className="relative w-full">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Role Selector */}
            <Select
              label="Account Type"
              options={roleOptions}
              error={errors.role?.message}
              {...register('role', { required: 'Account type selection is required' })}
            />

            {/* Phone Input */}
            <Input
              label="Contact Phone Number"
              type="tel"
              placeholder="e.g. +1 (555) 019-2834"
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Phone number is required',
              })}
            />

            {/* Address Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Physical Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. NIT Agartala, Tripura"
                  className={`flex-grow px-4 py-2 bg-white border ${errors.address ? 'border-red-500' : 'border-slate-200'} rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  {...register('address', { required: 'Address is required' })}
                />
                <Button
                  type="button"
                  onClick={handleAddressLookup}
                  isLoading={isGeocoding}
                  variant="outline"
                  size="sm"
                >
                  Locate
                </Button>
              </div>
              {errors.address && (
                <span className="text-xs font-semibold text-red-500">{errors.address.message}</span>
              )}
            </div>

            {/* Pincode Input */}
            <Input
              label="Indian PIN Code (6 digits)"
              type="text"
              placeholder="e.g. 799046"
              error={errors.pincode?.message}
              {...register('pincode', {
                required: 'PIN Code is required',
                pattern: {
                  value: /^[1-9][0-9]{5}$/,
                  message: 'Please enter a valid 6-digit Indian PIN code',
                },
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Register Organization
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </Card>
      </Container>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageWrapper>
  );
};

export default Register;
