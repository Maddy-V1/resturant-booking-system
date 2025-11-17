import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSuccess, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(null);
  
  const { login, error, errorDetails, clearError, loading } = useAuth();

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (formData.email || formData.password) {
      clearError();
    }
  }, [formData, clearError]);

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    return errors;
  };

  useEffect(() => {
    if (errorDetails?.code === 'ACCOUNT_LOCKED' && errorDetails.retryAfterSeconds) {
      setLockCountdown(errorDetails.retryAfterSeconds);
      const interval = setInterval(() => {
        setLockCountdown(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          }
          clearInterval(interval);
          return 0;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    setLockCountdown(null);
  }, [errorDetails]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const result = await login(
      formData.email,
      formData.password,
      { remember: formData.rememberMe }
    );
    
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
    }
  };

  const formatCountdown = (seconds) => {
    if (seconds == null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins <= 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-orange-200 via-rose-200 to-blue-200 opacity-60 blur-xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-blue-500" />
        <div className="px-6 py-7 sm:px-8 sm:py-9 space-y-6">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-4 py-1 text-xs font-semibold text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Trusted Beta Access
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back to the canteen
            </h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-left text-sm text-red-800">
              <p className="font-semibold">{error}</p>
              {errorDetails?.code === 'ACCOUNT_LOCKED' && (
                <p className="text-xs opacity-80">
                  Try again in{' '}
                  {formatCountdown((lockCountdown ?? errorDetails.retryAfterSeconds) || 0)}. This is
                  to keep your meal pass safe.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    formErrors.email ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="eg. student@college.edu"
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[10px] uppercase tracking-widest text-gray-300">
                  VERIFIED
                </span>
              </div>
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    formErrors.password ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  className="absolute inset-y-0 right-4 text-xs font-semibold uppercase tracking-wide text-orange-600"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting || loading}
                >
                  {isPasswordVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500">{formErrors.password}</p>
              )}
              <p className="text-xs text-gray-400">
                We recommend logging in from your personal device to keep pickup slips private.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-gray-600">
              <label className="inline-flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  disabled={isSubmitting || loading}
                />
                Keep me signed in on this device
              </label>
              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                Session shielded
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
              {isSubmitting || loading ? 'Signing you in…' : 'Enter the canteen'}
            </button>
          </form>

          <div className="space-y-3 text-center text-xs text-gray-500">
            <p>
              Need an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="font-semibold text-orange-600 hover:text-orange-700"
                disabled={isSubmitting || loading}
              >
                Request access
              </button>
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-gray-500">
              Login with the same WhatsApp number you quote at the counter — every offline order
              raised on that number will show up here within seconds.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;