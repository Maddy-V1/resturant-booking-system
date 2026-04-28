import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  const handleSignupSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showLogin ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setShowLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setShowLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
