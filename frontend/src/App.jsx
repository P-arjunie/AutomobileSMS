import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import AllAppointmentsManagement from './components/AllAppointmentsManagement'
import AllServicesOverview from './components/AllServicesOverview'
import ReportsPage from './components/ReportsPage'
import DevModeBypass from './components/DevModeBypass'
import EmployeeDashboard from './components/EmployeeDashboard'
import TimeLoggingInterface from './components/TimeLoggingInterface'
import MyWorkPage from './components/MyWorkPage'
import LoadingSpinner from './components/LoadingSpinner'
import Profile from './components/Profile'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/VerifyEmail'
import BookAppointment from './components/BookAppointment'
import MyAppointments from './components/MyAppointments'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Employee-only Route component
const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user && (user.role === 'employee' || user.role === 'admin')) {
    return children
  }
  
  // Redirect to appropriate dashboard based on user role
  return <RoleBasedRedirect />
}

// Public Route component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (isAuthenticated) {
    // Redirect based on user role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user?.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }
  
  return children
}

// Role-aware redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth()
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  } else if (user?.role === 'employee') {
    return <Navigate to="/employee/dashboard" replace />
  } else {
    return <Navigate to="/dashboard" replace />
  }
}

// Admin Route component (requires admin role)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role === 'admin') {
    return children
  }
  
  // Redirect to appropriate dashboard based on user role
  return <RoleBasedRedirect />
}

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/appointments/book" element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/appointments/my" element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          {/* Development Mode - Bypass auth for testing (REMOVE IN PRODUCTION!) */}
          <Route path="/dev" element={<DevModeBypass />} />
          <Route path="/dev/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/dev/admin/appointments" element={<AllAppointmentsManagement />} />
          <Route path="/dev/admin/services" element={<AllServicesOverview />} />
          <Route path="/dev/admin/reports" element={<ReportsPage />} />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/appointments" element={
            <AdminRoute>
              <AllAppointmentsManagement />
            </AdminRoute>
          } />
          <Route path="/admin/services" element={
            <AdminRoute>
              <AllServicesOverview />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          } />
          {/* Employee routes */}
          <Route path="/employee/dashboard" element={
            <EmployeeRoute>
              <EmployeeDashboard />
            </EmployeeRoute>
          } />
          <Route path="/employee/time-logging" element={
            <EmployeeRoute>
              <TimeLoggingInterface />
            </EmployeeRoute>
          } />
          <Route path="/employee/my-work" element={
            <EmployeeRoute>
              <MyWorkPage />
            </EmployeeRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
            error: {
              duration: 4000,
              theme: {
                primary: '#f56565',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
