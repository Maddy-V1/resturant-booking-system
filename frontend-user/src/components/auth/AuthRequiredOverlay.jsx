import React, { useEffect, useMemo, useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '../../context/AuthContext';

const copyByContext = {
  menu: {
    badge: 'Menu Preview',
    title: 'Sign in to continue your order',
    subtitle:
      'Browse everything you like, but we need you to log in before we can pin items to your tray.',
    bullets: [
      'Use the same WhatsApp number you share at the counter.',
      'We sync your offline slips and counter orders to this account automatically.',
      'Skip queues during the beta by keeping your digital tab open.'
    ],
    highlight: 'Your menu stays visible underneath — log in and we unlock ordering instantly.'
  },
  cart: {
    badge: 'Cart Hold',
    title: 'Login to lock this cart',
    subtitle:
      'We keep the items warm for a few minutes — sign in so we can reserve them against your name.',
    bullets: [
      'Use the counter phone number to combine offline & online tickets.',
      'Track manual orders and instant notifications from the same dashboard.',
      'One login keeps billing, pickup slips, and refunds in sync.'
    ],
    highlight: 'Once you are in, every offline token raised on your number will appear here.'
  }
};

const AuthRequiredOverlay = ({ context = 'menu' }) => {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!isAuthenticated);
  }, [isAuthenticated]);

  const copy = useMemo(() => copyByContext[context] || copyByContext.menu, [context]);

  if (!isVisible) {
    return null;
  }

  const switchToLogin = () => setMode('login');
  const switchToSignup = () => setMode('signup');
  const handleSuccess = () => setIsVisible(false);

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" />
      <div className="relative z-10 min-h-full overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white/90 rounded-3xl border border-white/60 shadow-2xl backdrop-blur-xl grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-10 border-b md:border-b-0 md:border-r border-white/60 bg-gradient-to-br from-orange-50 via-white to-red-50">
              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 mb-4">
                {copy.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{copy.title}</h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                {copy.subtitle}
              </p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                {copy.bullets.map((point) => (
                  <li key={point} className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-2xl bg-white shadow-inner border border-orange-100 text-sm font-medium text-orange-700">
                {copy.highlight}
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2 bg-gray-100 rounded-full p-1 text-sm font-medium">
                  <button
                    onClick={switchToLogin}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      mode === 'login'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={switchToSignup}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      mode === 'signup'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Sign up
                  </button>
                </div>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Beta Access
                </span>
              </div>

              {mode === 'login' ? (
                <LoginForm onSuccess={handleSuccess} onSwitchToSignup={switchToSignup} />
              ) : (
                <SignupForm onSuccess={handleSuccess} onSwitchToLogin={switchToLogin} />
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                Tip: login with the same mobile number you quote at the counter to merge offline
                receipts automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredOverlay;

