import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { OrderProvider } from './context/OrderContext'
import { ToastProvider } from './context/ToastContext'
import Header from './components/common/Header'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MenuPage from './pages/MenuPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/OrderHistoryPage'

// Temporary auth page component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    // Redirect to home page after successful authentication
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {isLogin ? (
        <LoginForm 
          onSuccess={handleAuthSuccess}
          onSwitchToSignup={() => setIsLogin(false)}
        />
      ) : (
        <SignupForm 
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
    </div>
  );
};



function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <OrderProvider>
          <SocketProvider>
            <Router>
          <div className="min-h-screen bg-gray-100">
            <Header />
            <main>
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route 
                  path="/menu" 
                  element={
                    <ProtectedRoute>
                      <MenuPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order/:orderId" 
                  element={<OrderTrackingPage />} 
                />
                <Route 
                  path="/account" 
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute redirectTo="/login">
                      <MenuPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
            </Router>
          </SocketProvider>
        </OrderProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App