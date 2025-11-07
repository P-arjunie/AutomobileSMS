import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    'waiting-parts': 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-200 text-gray-600'
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default function MyAppointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [showModify, setShowModify] = useState(false);
  const [modifyTargetId, setModifyTargetId] = useState(null);
  const [modifyReason, setModifyReason] = useState('');
  const [modifyDate, setModifyDate] = useState(''); // datetime-local string

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await appointmentsAPI.getAll(params);
      setItems(data.appointments || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      await appointmentsAPI.cancel(id);
      toast.success('Appointment cancelled');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cancel failed');
    }
  };

  const fmtDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);

  const openModify = (id) => {
    setModifyTargetId(id);
    setModifyReason('');
    setModifyDate('');
    setShowModify(true);
  };

  const submitModify = async () => {
    if (!modifyTargetId) return;
    try {
      const payload = {
        reason: modifyReason || 'Customer requested a reschedule',
        newScheduledDate: modifyDate ? new Date(modifyDate).toISOString() : undefined,
      };
      await appointmentsAPI.requestModification(modifyTargetId, payload);
      toast.success('Modification request submitted');
      setShowModify(false);
      setModifyTargetId(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary-blue/30 to-primary-purple/40 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-purple">
              My Appointments
            </h1>
            <p className="text-sm text-gray-600 mt-2">View, filter, and manage your service bookings.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={load} 
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-white hover:border-gray-300 transition shadow-sm"
            >
              Refresh
            </button>
            <Link 
              to="/appointments/book" 
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-xl text-sm font-semibold transition shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-purple rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Filter Appointments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select 
              value={filters.status} 
              onChange={e => setFilters({ ...filters, status: e.target.value })} 
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-parts">Waiting Parts</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={e => setFilters({ ...filters, startDate: e.target.value })} 
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition" 
            />
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={e => setFilters({ ...filters, endDate: e.target.value })} 
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition" 
            />
            <div className="md:col-span-2 flex gap-2">
              <button 
                onClick={load} 
                className="flex-1 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-xl px-4 py-3 font-semibold transition shadow-lg"
              >
                Apply Filters
              </button>
              <button 
                onClick={() => { setFilters({ status: '', startDate: '', endDate: '' }); load(); }} 
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading appointments...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-gray-500 text-lg font-medium mb-2">No appointments found.</div>
            <Link to="/appointments/book" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-xl font-semibold transition shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Book your first appointment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map(a => (
              <div key={a._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-blue to-primary-purple rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="text-xl font-bold text-gray-900 capitalize">{(a.serviceType || '').replace(/-/g, ' ')}</div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {fmtDateTime(a.scheduledDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCancel(a.status) && (
                      <button 
                        onClick={() => cancel(a._id)} 
                        className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-300 transition text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      className="px-4 py-2 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-300 transition text-sm" 
                      onClick={() => openModify(a._id)}
                    >
                      Request Modification
                    </button>
                  </div>
                </div>
                {a.vehicle && (
                    <div className="flex items-center gap-2 p-3 bg-primary-light rounded-lg border border-primary-blue/20 mb-3">
                    <svg className="w-5 h-5 text-primary-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <div className="text-sm font-semibold text-gray-900">
                      {a.vehicle.make} {a.vehicle.model} • {a.vehicle.year} • {a.vehicle.licensePlate}
                    </div>
                  </div>
                )}
                {a.description && (
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                    {a.description}
                  </div>
                )}

                {/* Modification requests history */}
                {a.modificationRequests && a.modificationRequests.length > 0 && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-primary-light to-primary-purple/30 rounded-xl border border-primary-blue/20">
                    <div className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Modification Requests
                    </div>
                    <ul className="space-y-2">
                      {a.modificationRequests.map((mr) => (
                        <li key={mr._id} className="p-3 border rounded-xl bg-white shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">Requested: {new Date(mr.requestedAt).toLocaleString()}</div>
                          <div className="text-sm font-medium text-gray-900 mb-1">Reason: {mr.reason}</div>
                          {mr.newScheduledDate && <div className="text-sm text-gray-700 mb-1">New Date: {new Date(mr.newScheduledDate).toLocaleString()}</div>}
                            <div className="text-sm flex items-center gap-2">
                            <span className="text-gray-700">Status:</span>
                            <strong className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-blue/10 text-primary-blue capitalize">{mr.status}</strong>
                          </div>
                          {mr.respondedAt && <div className="text-xs text-gray-500 mt-1">Responded: {new Date(mr.respondedAt).toLocaleString()}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModify && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-blue to-primary-purple rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Request Modification</h3>
                  <p className="text-sm text-gray-600">Submit a change request</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea 
                    value={modifyReason} 
                    onChange={e => setModifyReason(e.target.value)} 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none" 
                    placeholder="Why do you need to change this appointment?" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred New Date & Time <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input 
                    type="datetime-local" 
                    value={modifyDate} 
                    onChange={e => setModifyDate(e.target.value)} 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowModify(false)} 
                  className="flex-1 border-2 border-gray-200 rounded-xl py-3 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitModify} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
