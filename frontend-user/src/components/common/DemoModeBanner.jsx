import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import api from '../../utils/axios';

const DemoModeBanner = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBackendConnection = async () => {
      const token = localStorage.getItem('userToken');
      const isTestUser = token && token.startsWith('test-token-');
      
      // If not a test user, don't show banner
      if (!isTestUser) {
        setIsDemoMode(false);
        setIsChecking(false);
        return;
      }

      // Test user - check if backend is actually connected
      try {
        // Try to ping the backend
        await api.get('/menu', { timeout: 3000 });
        // Backend is connected, don't show banner
        setIsDemoMode(false);
      } catch (error) {
        // Backend is not connected, show banner
        setIsDemoMode(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBackendConnection();
  }, []);

  // Don't show anything while checking
  if (isChecking) {
    return null;
  }

  if (!isDemoMode || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                🧪 Demo Mode - Backend on Cold Start
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                Backend server is not connected or starting up. All data shown is for demonstration purposes only. Orders won't be processed.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors duration-200 flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;
