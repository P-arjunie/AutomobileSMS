import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeWorkAPI, timeLogsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const MyWorkPage = () => {
  const { user } = useAuth();
  const [assignedServices, setAssignedServices] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDate, calendarView]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load assigned services
      const servicesResponse = await employeeWorkAPI.getAssignedServices({ limit: 100 });
      const services = servicesResponse.data.services || [];
      setAssignedServices(services);

      // Get today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayServices = services.filter(service => {
        const scheduled = new Date(service.scheduledDate);
        return scheduled >= today && scheduled < tomorrow && 
               ['pending', 'confirmed', 'in-progress', 'waiting-parts'].includes(service.status);
      });
      setTodayTasks(todayServices);

      // Get completed history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const completedServices = services.filter(service => 
        service.status === 'completed' && 
        new Date(service.updatedAt || service.scheduledDate) >= thirtyDaysAgo
      );
      setCompletedHistory(completedServices.slice(0, 20));

      // Load metrics
      const statsResponse = await employeeWorkAPI.getDashboardStats();
      const summaryResponse = await timeLogsAPI.getSummary({ period: 'monthly' });
      
      setMetrics({
        totalHoursMonth: summaryResponse.data.summary.totalHours,
        totalLogsMonth: summaryResponse.data.summary.totalLogs,
        activeProjects: statsResponse.data.stats.activeProjects,
        completedProjects: statsResponse.data.stats.completedProjects,
        weeklyHours: statsResponse.data.stats.weeklyHours,
        monthlyHours: statsResponse.data.stats.monthlyHours
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load work data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getServicesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return assignedServices.filter(service => {
      const serviceDate = new Date(service.scheduledDate).toISOString().split('T')[0];
      return serviceDate === dateStr;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'waiting-parts': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading work data...</p>
        </div>
      </div>
    );
  }

  const calendarDays = getDaysInMonth(selectedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">My Work</h1>
            <div className="text-sm text-gray-700">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Personal Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Monthly Hours</div>
              <div className="text-2xl font-bold text-blue-600">{metrics.monthlyHours.toFixed(2)}h</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Weekly Hours</div>
              <div className="text-2xl font-bold text-green-600">{metrics.weeklyHours.toFixed(2)}h</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Time Logs</div>
              <div className="text-2xl font-bold text-purple-600">{metrics.totalLogsMonth}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Active Projects</div>
              <div className="text-2xl font-bold text-orange-600">{metrics.activeProjects}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-bold text-teal-600">{metrics.completedProjects}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium min-w-[150px] text-center">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const servicesOnDate = getServicesForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border border-gray-200 ${
                      isToday ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {servicesOnDate.slice(0, 2).map(service => (
                            <div
                              key={service._id}
                              className="text-xs px-1 py-0.5 rounded truncate bg-blue-100 text-blue-800"
                              title={`${service.vehicle.make} ${service.vehicle.model}`}
                            >
                              {service.vehicle.make}
                            </div>
                          ))}
                          {servicesOnDate.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{servicesOnDate.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Tasks</h3>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div
                    key={task._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {task.vehicle.year} {task.vehicle.make} {task.vehicle.model}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Customer: {task.customer?.firstName} {task.customer?.lastName}
                        </p>
                        {task.timeStats?.hasActiveTimer && (
                          <span className="inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Timer Active
                          </span>
                        )}
                      </div>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Scheduled: {formatDateTime(task.scheduledDate)}
                    </div>
                    {task.timeStats && (
                      <div className="mt-2 text-xs text-gray-500">
                        Time Logged: {task.timeStats.totalHours.toFixed(2)}h
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completed Work History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Completed Work History</h3>
          </div>
          <div className="overflow-x-auto">
            {completedHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed work in the last 30 days</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Logged</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedHistory.map(service => (
                    <tr key={service._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.vehicle.year} {service.vehicle.make} {service.vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.customer?.firstName} {service.customer?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(service.scheduledDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.updatedAt ? formatDate(service.updatedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.timeStats?.totalHours.toFixed(2) || 0}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyWorkPage;

