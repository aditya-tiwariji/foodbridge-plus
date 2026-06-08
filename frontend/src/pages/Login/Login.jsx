import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogIn } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if redirect due to expired session or suspension
  const isExpired = searchParams.get('expired') === 'true';
  const isSuspended = searchParams.get('suspended') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setToast(null);
    try {
      const userData = await login(data.email, data.password);
      setToast({ message: 'Welcome back! Login successful.', type: 'success' });
      
      let redirectRoute = '/dashboard';
      if (userData.role === 'ngo' || userData.role === 'recipient') {
        redirectRoute = '/ngo/dashboard';
      } else if (userData.role === 'admin') {
        redirectRoute = '/admin/dashboard';
      }

      console.log("REDIRECTING TO", redirectRoute);
      
      // Navigate to dashboard after short delay to show toast
      setTimeout(() => {
        navigate(redirectRoute);
      }, 1000);
    } catch (error) {
      setToast({
        message: error.message || 'Invalid login credentials. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-140px)]">
      <Container className="w-full max-w-md">
        {isExpired && !toast && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-lg text-center shadow-sm animate-pulse">
            Your session has expired. Please sign in again.
          </div>
        )}

        {isSuspended && !toast && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-lg text-center shadow-sm">
            Account suspended. Contact support.
          </div>
        )}

        <Card className="shadow-xl border border-slate-100 p-8 bg-white">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-primary-50 rounded-full text-primary-600 mb-4">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Access your FoodBridge+ account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. bistro@donor.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please provide a valid email address',
                },
              })}
            />

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your security password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline">
              Create one here
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

export default Login;
