import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';

export const useClaimableOrders = () => {
  const [claimableCount, setClaimableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useOrders();
  const { isAuthenticated } = useAuth();

  const fetchClaimableCount = async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setClaimableCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/users/claimable-orders');
      if (response.data.success) {
        setClaimableCount(response.data.data.length);
      }
    } catch (error) {
      // Only log error if it's not a 401 (unauthorized)
      if (error.response?.status !== 401) {
        console.error('Error fetching claimable orders count:', error);
      }
      setClaimableCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimableCount();
    
    // Only set up interval if user is authenticated
    if (isAuthenticated) {
      const interval = setInterval(fetchClaimableCount, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshTrigger, isAuthenticated]); // Re-fetch when refreshTrigger or auth status changes

  return { claimableCount, loading, refetch: fetchClaimableCount };
};