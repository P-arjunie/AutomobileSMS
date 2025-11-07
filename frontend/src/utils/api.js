import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (payload) => api.put('/auth/password', payload),
  refreshToken: (payload) => api.post('/auth/refresh-token', payload),
  logout: (payload) => api.post('/auth/logout', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  sendVerification: () => api.post('/auth/send-verification'),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload),
};

// Appointments API calls
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  updateStatus: (id, statusData) => api.patch(`/appointments/${id}/status`, statusData),
  assign: (id, employeeData) => api.patch(`/appointments/${id}/assign`, employeeData),
  requestModification: (id, requestData) => api.post(`/appointments/${id}/modification-request`, requestData),
  addNote: (id, noteData) => api.post(`/appointments/${id}/notes`, noteData),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  getAvailableSlots: (params) => api.get('/appointments/available-slots', { params }),
};

// Services API calls
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (serviceData) => api.post('/services', serviceData),
  update: (id, serviceData) => api.put(`/services/${id}`, serviceData),
  complete: (id) => api.patch(`/services/${id}/complete`),
  getSummary: (employeeId, params) => api.get(`/services/summary/employee/${employeeId}`, { params }),
  getTypes: () => api.get('/services/types'),
};

// Employees API calls
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  update: (id, employeeData) => api.put(`/employees/${id}`, employeeData),
  getWorkload: (id) => api.get(`/employees/${id}/workload`),
  getTimeSummary: (id, params) => api.get(`/employees/${id}/time-summary`, { params }),
  deactivate: (id) => api.patch(`/employees/${id}/deactivate`),
  activate: (id) => api.patch(`/employees/${id}/activate`),
};

// Time Logs API calls
export const timeLogsAPI = {
  getAll: (params) => api.get('/time-logs', { params }),
  getById: (id) => api.get(`/time-logs/${id}`),
  create: (timeLogData) => api.post('/time-logs', timeLogData),
  update: (id, timeLogData) => api.put(`/time-logs/${id}`, timeLogData),
  delete: (id) => api.delete(`/time-logs/${id}`),
  start: (serviceProjectId, description) => api.post('/time-logs/start', { serviceProjectId, description }),
  stop: (description) => api.post('/time-logs/stop', { description }),
  getSummary: (params) => api.get('/time-logs/summary', { params }),
};

// Employee Work API calls
export const employeeWorkAPI = {
  getAssignedServices: (params) => api.get('/employees/assigned-services', { params }),
  getDashboardStats: (params) => api.get('/employees/dashboard-stats', { params }),
  assignService: (serviceId, employeeId) => api.patch(`/employees/assign/${serviceId}`, { employeeId }),
};

// Vehicles API calls
export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (vehicleData) => api.post('/vehicles', vehicleData),
  update: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getHistory: (id, params) => api.get(`/vehicles/${id}/history`, { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Admin API calls
export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  
  // Appointments
  getAllAppointments: (params) => api.get('/admin/appointments', { params }),
  
  // Services
  getAllServices: (params) => api.get('/admin/services', { params }),
  
  // Employees
  getEmployeePerformance: (params) => api.get('/admin/employees/performance', { params }),
  
  // Customers
  getAllCustomers: (params) => api.get('/admin/customers', { params }),
  
  // Reports
  getServiceReports: (params) => api.get('/admin/reports/services', { params }),
  getAppointmentReports: (params) => api.get('/admin/reports/appointments', { params }),
};

// Reports API calls
export const reportsAPI = {
  generate: (reportData) => api.post('/reports/generate', reportData),
  export: (params) => api.get('/reports/export', { 
    params,
    responseType: 'blob' // Important for file downloads
  }),
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

export default api;
