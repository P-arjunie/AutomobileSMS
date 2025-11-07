import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
// Header is now provided by App layout
import socketService from '../utils/socket'
import { appointmentsAPI, servicesAPI } from '../utils/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [serviceLogs, setServiceLogs] = useState([])
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    inProgressAppointments: 0,
    completedAppointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    setupSocketListeners()

    return () => {
      // Clean up socket listeners
      socketService.off('new-appointment')
      socketService.off('appointment-status-changed')
      socketService.off('service-log-created')
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load appointments
      const appointmentsResponse = await appointmentsAPI.getAll()
      const appointmentsData = appointmentsResponse.data.appointments || []
      setAppointments(appointmentsData)

      // Load service logs if employee
      if (user.role === 'employee' || user.role === 'admin') {
        const serviceResponse = await servicesAPI.getAll()
        setServiceLogs(serviceResponse.data.serviceLogs || [])
      }

      // Calculate stats
      const stats = {
        totalAppointments: appointmentsData.length,
        pendingAppointments: appointmentsData.filter(app => app.status === 'pending').length,
        inProgressAppointments: appointmentsData.filter(app => app.status === 'in-progress').length,
        completedAppointments: appointmentsData.filter(app => app.status === 'completed').length
      }
      setStats(stats)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const setupSocketListeners = () => {
    // Listen for new appointments
    socketService.onNewAppointment((data) => {
      toast.success(`New appointment: ${data.message}`)
      loadDashboardData() // Refresh data
    })

    // Listen for status changes
    socketService.onAppointmentStatusChanged((data) => {
      toast.info(`Appointment status updated: ${data.newStatus}`)
      loadDashboardData() // Refresh data
    })

    // Listen for new service logs
    socketService.onServiceLogCreated((data) => {
      if (user.role === 'employee' || user.role === 'admin') {
        toast.success('New service log created')
        loadDashboardData() // Refresh data
      }
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue/30 border-t-primary-blue rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-primary-dark">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Admin Navigation Bar */}
      {user.role === 'admin' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center space-x-1">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Admin Tools</span>
              </div>
              <nav className="flex space-x-2">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition duration-200"
                >
                  Admin Dashboard
                </button>
                <button
                  onClick={() => navigate('/admin/appointments')}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200"
                >
                  All Appointments
                </button>
                <button
                  onClick={() => navigate('/admin/services')}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200"
                >
                  All Services
                </button>
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200"
                >
                  Reports
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Admin Notice Banner */}
        {user.role === 'admin' && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    You are logged in as an administrator
                  </p>
                  <p className="text-sm text-blue-600">
                    Access the full Admin Dashboard to view system-wide statistics, manage all appointments, and generate reports.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 whitespace-nowrap"
              >
                Go to Admin Dashboard →
              </button>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Appointments</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingAppointments}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">In Progress</div>
                <div className="text-2xl font-bold text-gray-900">{stats.inProgressAppointments}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Completed</div>
                <div className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Customers */}
        {user.role === 'customer' && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/vehicles')}
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a2 2 0 012-2h2a2 2 0 012 2v4a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <div className="text-sm font-medium text-gray-900">My Vehicles</div>
                  <div className="text-sm text-gray-500">Manage your registered vehicles</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/book-appointment')}
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <div className="text-sm font-medium text-gray-900">Book Service</div>
                  <div className="text-sm text-gray-500">Schedule a service appointment</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <div className="text-sm font-medium text-gray-900">My Profile</div>
                  <div className="text-sm text-gray-500">Update your account information</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.slice(0, 10).map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.customer?.firstName} {appointment.customer?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(appointment.scheduledDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {appointments.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
