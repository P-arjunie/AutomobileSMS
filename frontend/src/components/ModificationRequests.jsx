import React, { useEffect, useState } from 'react';
import { modificationRequestsAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ModificationRequests() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user && (user.role === 'employee' || user.role === 'admin')) {
      loadRequests();
    }
  }, [user, isLoading]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data } = await modificationRequestsAPI.getAll({ status: 'pending', limit: 50 });
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load modification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await modificationRequestsAPI.approve(requestId);
      toast.success('Request approved');
      setRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async (requestId) => {
    const reason = window.prompt('Optional rejection reason');
    try {
      await modificationRequestsAPI.reject(requestId, { reason });
      toast.success('Request rejected');
      setRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Reject failed');
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Modification Requests</h1>
          <div>
            <button onClick={loadRequests} className="px-3 py-2 border rounded">Refresh</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          {loading ? (
            <div>Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-500 p-8">No pending modification requests</div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.requestId} className="p-4 border rounded-lg flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Appointment: {req.appointmentId} • {new Date(req.scheduledDate).toLocaleString()}</div>
                    <div className="font-medium">{req.serviceType?.replace(/-/g,' ')}</div>
                    <div className="text-sm text-gray-700 mt-1">Customer: {req.customer?.firstName} {req.customer?.lastName} • {req.customer?.email}</div>
                    <div className="text-sm text-gray-600 mt-2">Reason: {req.reason}</div>
                    {req.newScheduledDate && <div className="text-sm text-gray-600">Requested new date: {new Date(req.newScheduledDate).toLocaleString()}</div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleApprove(req.requestId)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                    <button onClick={() => handleReject(req.requestId)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
