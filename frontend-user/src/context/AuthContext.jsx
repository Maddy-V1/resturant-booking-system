import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const result = await authService.verifyToken();
        if (result.success) {
          setUser(result.data.user);
        } else {
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, options = {}) => {
    try {
      setError(null);
      setErrorDetails(null);
      setLoading(true);
      
      const result = await authService.login({ email, password }, options);
      
      if (result.success) {
        setUser(result.data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        setError(result.error.message);
        setErrorDetails(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = 'Login failed';
      setError(errorMessage);
      setErrorDetails({ message: errorMessage, code: 'LOGIN_ERROR' });
      return { success: false, error: { message: errorMessage } };
    }
  };

  const signup = async (userData, options = {}) => {
    try {
      setError(null);
      setErrorDetails(null);
      setLoading(true);
      
      const result = await authService.signup(userData, options);
      
      if (result.success) {
        setUser(result.data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        setError(result.error.message);
        setErrorDetails(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = 'Signup failed';
      setError(errorMessage);
      setErrorDetails({ message: errorMessage, code: 'SIGNUP_ERROR' });
      return { success: false, error: { message: errorMessage } };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
    setErrorDetails(null);
  };

  const clearError = () => {
    setError(null);
    setErrorDetails(null);
  };

  const value = {
    user,
    loading,
    error,
    errorDetails,
    login,
    signup,
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};