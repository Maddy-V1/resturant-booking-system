import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useClaimableOrders } from '../../hooks/useClaimableOrders';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { claimableCount } = useClaimableOrders();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">College Canteen</Link>
        
        {isAuthenticated ? (
          <nav className="flex items-center space-x-4">
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
              <li><Link to="/menu" className="hover:text-blue-200">Menu</Link></li>
              <li><Link to="/orders" className="hover:text-blue-200">My Orders</Link></li>
              <li>
                <Link to="/account" className="hover:text-blue-200 relative">
                  Account
                  {isAuthenticated && claimableCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {claimableCount}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
            <div className="flex items-center space-x-4 ml-6 border-l border-blue-500 pl-6">
              <span className="text-sm">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition duration-200"
              >
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/login" className="hover:text-blue-200">Login</Link></li>
              <li><Link to="/signup" className="hover:text-blue-200">Sign Up</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;