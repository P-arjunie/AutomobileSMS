import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  
  // Dev mode: use mock user if in dev mode
  const isDevMode = window.location.pathname.includes('/dev');
  const user = isDevMode ? { role: 'admin' } : authUser;
  const [reportType, setReportType] = useState('service-completion');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Allow dev mode access (when URL contains /dev)
    const isDevMode = window.location.pathname.includes('/dev');
    
    if (!isDevMode && user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadSavedReports();
  }, [user, navigate]);

  const loadSavedReports = async () => {
    try {
      const response = await reportsAPI.getAll();
      setSavedReports(response.data.reports || []);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      const reportPayload = {
        name: `${reportType.replace('-', ' ')} Report - ${new Date().toLocaleDateString()}`,
        type: reportType,
        dateRange,
        filters,
        format: 'json',
        description: `Generated ${reportType} report`
      };

      const response = await reportsAPI.generate(reportPayload);
      setReportData(response.data.data);
      toast.success('Report generated successfully');
      
      // Reload saved reports
      await loadSavedReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async (format = 'csv', reportId = null) => {
    try {
      const params = {
        format,
        ...(reportId ? { reportId } : {
          type: reportType,
          dateRange,
          filters
        })
      };
      const response = await reportsAPI.export(params);

      // Create blob and download
      const mime = format === 'csv' ? 'text/csv' : (format === 'pdf' ? 'application/pdf' : 'application/json');
      const ext = format === 'pdf' ? 'pdf' : (format === 'csv' ? 'csv' : 'json');
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await reportsAPI.delete(id);
      toast.success('Report deleted successfully');
      await loadSavedReports();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderReportData = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'service-completion':
        return (
          <div className="space-y-6">
            {reportData.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Completed</p>
                    <p className="text-2xl font-bold">{reportData.summary.totalCompleted || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold">{reportData.summary.totalHours?.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Labor Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalLaborCost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Parts Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalPartsCost || 0)}</p>
                  </div>
                </div>
              </div>
            )}
            {reportData.dailyBreakdown && reportData.dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Daily Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.dailyBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.totalHours?.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'employee-productivity':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Employee Productivity</h4>
            {reportData.employees && reportData.employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Hours/Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.employees.map((emp, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.employeeName} ({emp.employeeId})</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.totalJobs}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.completedJobs}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.totalHours?.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.avgHoursPerJob?.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.completionRate?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        );

      case 'customer-history':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Customer Service History</h4>
            {reportData.customers && reportData.customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.customers.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.totalAppointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.completedAppointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(customer.totalSpent || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(customer.avgCost || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6">
            {reportData.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Revenue Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold">{reportData.summary.totalAppointments || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.avgRevenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Min/Max Revenue</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(reportData.summary.minRevenue || 0)} / {formatCurrency(reportData.summary.maxRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Daily Revenue</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.dailyRevenue.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.revenue || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500">No preview available for this report type</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-600 hover:text-blue-600"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Reports</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Generation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
              
              <div className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      setReportData(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="service-completion">Service Completion</option>
                    <option value="employee-productivity">Employee Productivity</option>
                    <option value="customer-history">Customer Service History</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="appointments">Appointments Report</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Additional Filters based on report type */}
                {reportType === 'employee-productivity' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department (optional)
                    </label>
                    <input
                      type="text"
                      value={filters.department || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., mechanical"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>

                {/* Export Buttons */}
                {reportData && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700">Export Format:</p>
                    <button
                      onClick={() => handleExportReport('csv')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExportReport('pdf')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('json')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Reports */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Reports</h2>
              {isLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : savedReports.length > 0 ? (
                <div className="space-y-2">
                  {savedReports.map((report) => (
                    <div key={report._id} className="p-3 bg-gray-50 rounded-md flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.type.replace('-', ' ')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleExportReport('csv', report._id)}
                          className="text-xs text-green-600 hover:text-green-700"
                          title="Export CSV"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleExportReport('pdf', report._id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 ml-2"
                          title="Export PDF"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          className="text-xs text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No saved reports</p>
              )}
            </div>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2">
            {reportData ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
                  </div>
                  {renderReportData()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No report generated</h3>
                <p className="mt-1 text-sm text-gray-500">Generate a report to see preview here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;

