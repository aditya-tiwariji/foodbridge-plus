import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Check, X } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword', '');

  // Password strength checks
  const checks = {
    length: newPasswordValue.length >= 8,
    hasLetter: /[a-zA-Z]/.test(newPasswordValue),
    hasNumber: /[0-9]/.test(newPasswordValue),
    hasSymbol: /[^a-zA-Z0-9]/.test(newPasswordValue),
  };

  const isPasswordStrong = Object.values(checks).every(Boolean);

  const onSubmit = async (data) => {
    if (!token) {
      setToast({ message: 'Invalid reset token. Please request a new link.', type: 'error' });
      return;
    }

    if (!isPasswordStrong) {
      setToast({ message: 'Please fulfill all password strength requirements.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setToast(null);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        setToast({ message: 'Password has been reset successfully.', type: 'success' });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Reset link is invalid or expired. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-140px)]">
      <Container className="w-full max-w-md">
        <Card className="shadow-xl border border-slate-100 p-8 bg-white relative overflow-hidden">
          {/* Top aesthetic border decorator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-primary-600"></div>

          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-primary-50 rounded-full text-primary-600 mb-4 shadow-inner">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
            <p className="text-slate-500 text-sm mt-1">
              Create a new strong security password
            </p>
          </div>

          {!token ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-sm leading-relaxed">
                Security token is missing. Please request a password reset link first.
              </div>
              <Link to="/forgot-password" className="block w-full">
                <Button variant="primary" className="w-full">
                  Go to Forgot Password
                </Button>
              </Link>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm leading-relaxed font-semibold">
                Your password has been changed successfully! Redirecting you to the login screen...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* New Password */}
              <div className="space-y-1">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                  error={errors.newPassword?.message}
                  {...register('newPassword', {
                    required: 'New password is required',
                    validate: value => isPasswordStrong || 'Password does not meet strength requirements',
                  })}
                />

                {/* Password Strength Checklist */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mt-2 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-600 block mb-1">Password Strength Checklist:</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {checks.length ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300 stroke-[3]" />
                    )}
                    <span className={checks.length ? 'text-emerald-700 font-medium' : ''}>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {checks.hasLetter ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300 stroke-[3]" />
                    )}
                    <span className={checks.hasLetter ? 'text-emerald-700 font-medium' : ''}>Contains at least one letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {checks.hasNumber ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300 stroke-[3]" />
                    )}
                    <span className={checks.hasNumber ? 'text-emerald-700 font-medium' : ''}>Contains at least one number</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {checks.hasSymbol ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300 stroke-[3]" />
                    )}
                    <span className={checks.hasSymbol ? 'text-emerald-700 font-medium' : ''}>Contains at least one symbol (e.g. @, #, $, !)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your new password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === newPasswordValue || 'Passwords do not match',
                })}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </form>
          )}

          <div className="text-center mt-6 border-t border-slate-100 pt-4">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors duration-200">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
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

export default ResetPassword;
