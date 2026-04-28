import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { OrderProvider } from './context/OrderContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/common/Navbar'
import DemoModeBanner from './components/common/DemoModeBanner'
import AuthPage from './pages/AuthPage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/OrderHistoryPage'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DemoModeBanner />
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/order/:orderId" element={<OrderTrackingPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                    <Route path="/" element={<MenuPage />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <OrderProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </OrderProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App