import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminHeader = () => {
  const { user, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">College Canteen Admin</Link>
        
        <nav className="flex items-center space-x-6">
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:text-gray-300">Dashboard</Link></li>
            <li><Link to="/menu" className="hover:text-gray-300">Menu</Link></li>
            <li><Link to="/kitchen" className="hover:text-gray-300">Kitchen</Link></li>
            <li><Link to="/pickup" className="hover:text-gray-300">Pickup</Link></li>
          </ul>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;