import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminHeader from './components/common/AdminHeader'
import AdminDashboard from './pages/AdminDashboard'
import ManualOrderPage from './pages/ManualOrderPage'
import MenuManagementPage from './pages/MenuManagementPage'
import OrderQueuePage from './pages/OrderQueuePage'
import OfflinePaymentPage from './pages/OfflinePaymentPage'

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <ProtectedRoute>
            <AdminHeader />
            <main>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/manual-order" element={<ManualOrderPage />} />
                <Route path="/menu" element={<MenuManagementPage />} />
                <Route path="/orders" element={<OrderQueuePage />} />
                <Route path="/payments" element={<OfflinePaymentPage />} />
              </Routes>
            </main>
          </ProtectedRoute>
        </div>
      </Router>
    </AdminAuthProvider>
  )
}

export default App