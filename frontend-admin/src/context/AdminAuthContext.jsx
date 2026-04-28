import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check for hardcoded test staff FIRST - no backend call
      if (token.startsWith('test-admin-token-')) {
        const testStaff = localStorage.getItem('testStaff');
        if (testStaff) {
          try {
            const staffData = JSON.parse(testStaff);
            if (staffData.role === 'staff') {
              setUser(staffData);
              setLoading(false);
              return; // Exit early, don't call backend
            }
          } catch (error) {
            console.error('Error parsing test staff:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('testStaff');
            setLoading(false);
            return;
          }
        }
      }

      // Only call backend for non-test tokens
      try {
        const response = await api.get('/auth/verify');
        if (response.data.data.user && response.data.data.user.role === 'staff') {
          setUser(response.data.data.user);
        } else {
          // User is not staff, clear token
          localStorage.removeItem('adminToken');
          localStorage.removeItem('testStaff');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('testStaff');
      } finally {
        setLoading(false);
      }
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

      // Only allow staff to access admin panel
      if (userData.role !== 'staff') {
        throw new Error('Access denied. Staff credentials required.');
      }

      // Store token and set user
      localStorage.setItem('adminToken', token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('testStaff');
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
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};