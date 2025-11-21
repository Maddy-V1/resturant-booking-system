import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminHeader = () => {
  const { user, logout } = useAdminAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-800 text-white shadow-md relative z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold truncate mr-4">College Canteen Admin</Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-700 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4 animate-fade-in-down">
            <ul className="flex flex-col space-y-3">
              <li>
                <Link
                  to="/"
                  className="block py-2 px-4 hover:bg-gray-700 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/menu"
                  className="block py-2 px-4 hover:bg-gray-700 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Menu Management
                </Link>
              </li>
              <li>
                <Link
                  to="/kitchen"
                  className="block py-2 px-4 hover:bg-gray-700 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kitchen View
                </Link>
              </li>
              <li>
                <Link
                  to="/pickup"
                  className="block py-2 px-4 hover:bg-gray-700 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pickup Counter
                </Link>
              </li>
            </ul>

            {user && (
              <div className="mt-4 pt-4 border-t border-gray-700 px-4">
                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-gray-400">
                    Signed in as {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;