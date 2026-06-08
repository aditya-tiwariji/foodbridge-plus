import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Toast from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';

const ForgotPassword = () => {
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setToast(null);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data.success) {
        setIsSent(true);
        setToast({ message: 'Reset link sent to your email successfully.', type: 'success' });
      }
    } catch (error) {
      setToast({
        message: error.message || 'Something went wrong. Please try again.',
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
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Forgot Password</h2>
            <p className="text-slate-500 text-sm mt-1">
              {isSent 
                ? "Check your inbox for a reset link" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {isSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm leading-relaxed">
                We've sent a link to your email. Click on that link to securely reset your password. The link will expire in 10 minutes.
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2"
                onClick={() => setIsSent(false)}
              >
                <Send className="h-4 w-4" />
                Resend Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Send Reset Link
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

export default ForgotPassword;
