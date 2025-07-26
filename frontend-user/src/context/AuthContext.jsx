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



  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/verify');
          setUser(response.data.data.user);
        } catch (error) {
          localStorage.removeItem('token');
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
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      setUser(userData);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/signup', userData);
      
      const { token, user: newUser } = response.data.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      setUser(newUser);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.error?.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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