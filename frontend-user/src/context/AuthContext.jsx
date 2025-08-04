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

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await authService.login({ email, password });
      
      if (result.success) {
        setUser(result.data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        setError(result.error.message);
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await authService.signup(userData);
      
      if (result.success) {
        setUser(result.data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        setError(result.error.message);
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
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