import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const SignupForm = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signup, error, clearError, loading } = useAuth();

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (Object.values(formData).some(value => value)) {
      clearError();
    }
  }, [formData, clearError]);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // WhatsApp validation
    if (!formData.whatsapp.trim()) {
      errors.whatsapp = 'WhatsApp number is required';
    } else if (!/^\+?[\d\s-()]{10,15}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      errors.whatsapp = 'Please enter a valid WhatsApp number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear confirm password error if passwords now match
    if (name === 'password' && formData.confirmPassword && value === formData.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }
    if (name === 'confirmPassword' && formData.password && value === formData.password) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: ''
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

    // Prepare data for API (exclude confirmPassword)
    const { confirmPassword, ...signupData } = formData;
    
    const result = await signup(signupData);
    
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-lime-200 via-emerald-200 to-orange-200 opacity-60 blur-xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-lime-500 to-orange-500" />
        <div className="px-6 py-7 sm:px-8 sm:py-9 space-y-6">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Early Access Request
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create your warm table identity
            </h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.name ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="Eg. Aanya Sharma"
                  autoComplete="name"
                  disabled={isSubmitting || loading}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Campus Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.email ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="student@college.edu"
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                WhatsApp Number (used at counter)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.whatsapp ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  disabled={isSubmitting || loading}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  Sync ready
                </span>
              </div>
              {formErrors.whatsapp && (
                <p className="text-xs text-red-500">{formErrors.whatsapp}</p>
              )}
              <p className="text-xs text-gray-500">
                This links your offline slips + manual orders to the app automatically.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      formErrors.password ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-4 text-xs font-semibold uppercase tracking-wide text-emerald-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting || loading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                      formErrors.confirmPassword ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-4 text-xs font-semibold uppercase tracking-wide text-emerald-600"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    disabled={isSubmitting || loading}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <PasswordStrengthMeter password={formData.password} />

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-lime-500 to-orange-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
            {isSubmitting || loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="space-y-3 text-center text-xs text-gray-500">
            <p>
              Already part of the beta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-emerald-600 hover:text-emerald-700"
                disabled={isSubmitting || loading}
              >
                Sign in
              </button>
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-gray-500">
              We include manual slips, offline counter orders and reservation notes tied to the phone
              number you provide. Keep it consistent for a premium pickup flow.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;