import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, employeeWorkAPI } from '../utils/api';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const TimeLoggingInterface = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preSelectedService = searchParams.get('service');

  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [assignedServices, setAssignedServices] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedService, setSelectedService] = useState(preSelectedService || '');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'week'
  });
  const [manualEntry, setManualEntry] = useState({
    serviceProjectId: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadSummary();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    if (activeTimer) {
      updateTimer();
    }
  }, [activeTimer]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load assigned services
      const servicesResponse = await employeeWorkAPI.getAssignedServices({ limit: 100 });
      setAssignedServices(servicesResponse.data.services || []);

      // Load active timer
      const statsResponse = await employeeWorkAPI.getDashboardStats();
      if (statsResponse.data.stats.hasActiveTimer) {
        setActiveTimer(statsResponse.data.stats.activeTimer);
        calculateTimerSeconds(statsResponse.data.stats.activeTimer.startTime);
      }

      // Load time logs
      const logsResponse = await timeLogsAPI.getAll({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100
      });
      setTimeLogs(logsResponse.data.timeLogs || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryResponse = await timeLogsAPI.getSummary({
        period: filters.period,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const calculateTimerSeconds = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    setTimerSeconds(diff);
  };

  const updateTimer = () => {
    if (activeTimer) {
      calculateTimerSeconds(activeTimer.startTime);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!selectedService) {
      toast.error('Please select a service project');
      return;
    }

    try {
      const response = await timeLogsAPI.start(selectedService, '');
      setActiveTimer({
        id: response.data.timeLog._id,
        startTime: response.data.timeLog.startTime,
        serviceProject: response.data.timeLog.serviceProject,
        durationMinutes: 0
      });
      toast.success('Timer started successfully');
      loadData();
      loadSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start timer';
      toast.error(message);
    }
  };

  const handleStopTimer = async () => {
    try {
      await timeLogsAPI.stop('');
      setActiveTimer(null);
      setTimerSeconds(0);
      toast.success('Timer stopped successfully');
      loadData();
      loadSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to stop timer';
      toast.error(message);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    if (!manualEntry.serviceProjectId || !manualEntry.startTime || !manualEntry.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await timeLogsAPI.create({
        serviceProjectId: manualEntry.serviceProjectId,
        startTime: new Date(manualEntry.startTime).toISOString(),
        endTime: new Date(manualEntry.endTime).toISOString(),
        description: manualEntry.description
      });
      toast.success('Time log created successfully');
      setShowManualEntry(false);
      setManualEntry({
        serviceProjectId: '',
        startTime: '',
        endTime: '',
        description: ''
      });
      loadData();
      loadSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create time log';
      toast.error(message);
    }
  };

  const handleEditLog = async (logId, updates) => {
    try {
      await timeLogsAPI.update(logId, updates);
      toast.success('Time log updated successfully');
      setEditingLog(null);
      loadData();
      loadSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update time log';
      toast.error(message);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this time log?')) {
      return;
    }

    try {
      await timeLogsAPI.delete(logId);
      toast.success('Time log deleted successfully');
      loadData();
      loadSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete time log';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Time Logging</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                {showManualEntry ? 'Cancel' : 'Manual Entry'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Active Timer Display */}
        {activeTimer && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Active Timer</h3>
                <p className="text-sm text-gray-600">
                  {activeTimer.serviceProject?.vehicle?.make} {activeTimer.serviceProject?.vehicle?.model}
                  {' - '}
                  {activeTimer.serviceProject?.serviceType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-3xl font-mono font-bold text-blue-600 mt-2">
                  {formatTime(timerSeconds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Started: {formatDate(activeTimer.startTime)}
                </p>
              </div>
              <button
                onClick={handleStopTimer}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md text-sm font-medium"
              >
                Stop Timer
              </button>
            </div>
          </div>
        )}

        {/* Start Timer Section */}
        {!activeTimer && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Start Timer</h3>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Service Project
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">-- Select a service --</option>
                  {assignedServices
                    .filter(service => ['confirmed', 'in-progress', 'waiting-parts'].includes(service.status))
                    .map(service => (
                      <option key={service._id} value={service._id}>
                        {service.vehicle.year} {service.vehicle.make} {service.vehicle.model} - {service.serviceType.replace('-', ' ')}
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={handleStartTimer}
                disabled={!selectedService}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Start Timer
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        {showManualEntry && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Time Entry</h3>
            <form onSubmit={handleManualEntry}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Project *
                  </label>
                  <select
                    value={manualEntry.serviceProjectId}
                    onChange={(e) => setManualEntry({ ...manualEntry, serviceProjectId: e.target.value })}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">-- Select a service --</option>
                    {assignedServices.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.vehicle.year} {service.vehicle.make} {service.vehicle.model} - {service.serviceType.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={manualEntry.description}
                    onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Work description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Save Time Log
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Section */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Time Summary</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setFilters({ ...filters, period: 'daily' }); loadSummary(); }}
                  className={`px-3 py-1 rounded text-sm ${filters.period === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => { setFilters({ ...filters, period: 'weekly' }); loadSummary(); }}
                  className={`px-3 py-1 rounded text-sm ${filters.period === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => { setFilters({ ...filters, period: 'monthly' }); loadSummary(); }}
                  className={`px-3 py-1 rounded text-sm ${filters.period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold text-blue-600">{summary.summary.totalHours.toFixed(2)}h</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Logs</div>
                <div className="text-2xl font-bold text-green-600">{summary.summary.totalLogs}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Completed Logs</div>
                <div className="text-2xl font-bold text-purple-600">{summary.summary.completedLogs}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Avg Hours/Day</div>
                <div className="text-2xl font-bold text-orange-600">{summary.summary.averageHoursPerDay}</div>
              </div>
            </div>
          </div>
        )}

        {/* Time Log History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Time Log History</h3>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); loadData(); }}
                placeholder="Start Date"
                className="rounded-md border-gray-300 shadow-sm text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); loadData(); }}
                placeholder="End Date"
                className="rounded-md border-gray-300 shadow-sm text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {timeLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No time logs found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.startTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.serviceProject?.vehicle?.make} {log.serviceProject?.vehicle?.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(log.durationMinutes)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          log.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Edit Time Log</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleEditLog(editingLog._id, {
                  startTime: formData.get('startTime'),
                  endTime: formData.get('endTime'),
                  description: formData.get('description')
                });
              }}>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      defaultValue={new Date(editingLog.startTime).toISOString().slice(0, 16)}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      defaultValue={editingLog.endTime ? new Date(editingLog.endTime).toISOString().slice(0, 16) : ''}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingLog.description}
                      className="w-full rounded-md border-gray-300 shadow-sm"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TimeLoggingInterface;

