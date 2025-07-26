import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLoginForm from './AdminLoginForm';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  return children;
};

export default ProtectedRoute;