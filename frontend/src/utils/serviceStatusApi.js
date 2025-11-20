import api from './api';

export const getServiceStatus = (id) => api.get(`/service-status/${id}/status`);
export const getServiceTimeline = (id) => api.get(`/service-status/${id}/timeline`);
export const updateServiceStatus = (id, data) => api.patch(`/service-status/${id}/status`, data);
export const addServiceNote = (id, data) => api.post(`/service-status/${id}/updates`, data);
