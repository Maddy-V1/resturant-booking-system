import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

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
      const token = localStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check for hardcoded test user FIRST - no backend call
      if (token.startsWith('test-token-')) {
        const testUser = localStorage.getItem('testUser');
        if (testUser) {
          try {
            setUser(JSON.parse(testUser));
            setLoading(false);
            return; // Exit early, don't call backend
          } catch (error) {
            console.error('Error parsing test user:', error);
            localStorage.removeItem('userToken');
            localStorage.removeItem('testUser');
            setLoading(false);
            return;
          }
        }
      }

      // Only call backend for non-test tokens
      try {
        const response = await api.get('/auth/verify');
        if (response.data.data.user) {
          setUser(response.data.data.user);
        } else {
          localStorage.removeItem('userToken');
          localStorage.removeItem('testUser');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('testUser');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, options = {}) => {
    try {
      setError(null);
      setErrorDetails(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data.data;

      // Store token and set user
      localStorage.setItem('userToken', token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data?.error;
      const errorMessage = errorData?.message || error.message || 'Login failed';
      
      setError(errorMessage);
      setErrorDetails(errorData || null);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, whatsapp, password) => {
    try {
      setError(null);
      setErrorDetails(null);
      setLoading(true);

      const response = await api.post('/auth/signup', {
        name,
        email,
        whatsapp,
        password,
        role: 'student'
      });

      const { token, user: userData } = response.data.data;

      // Store token and set user
      localStorage.setItem('userToken', token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data?.error;
      const errorMessage = errorData?.message || error.message || 'Signup failed';
      
      setError(errorMessage);
      setErrorDetails(errorData || null);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('testUser');
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