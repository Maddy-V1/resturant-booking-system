import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const ProfileInfo = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      
      if (response.data.success) {
        setProfile(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p>Error loading profile: {error}</p>
          <button 
            onClick={fetchProfile}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Name
          </label>
          <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-md">
            {profile?.name || 'N/A'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-md">
            {profile?.email || 'N/A'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            WhatsApp Number
          </label>
          <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-md">
            {profile?.whatsapp || 'N/A'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Member Since
          </label>
          <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-md">
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;