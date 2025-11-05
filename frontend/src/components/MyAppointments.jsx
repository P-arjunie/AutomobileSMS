import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../utils/socket';

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
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModify, setShowModify] = useState(false);
  const [modifyTargetId, setModifyTargetId] = useState(null);
  const [modifyReason, setModifyReason] = useState('');
  const [modifyDate, setModifyDate] = useState(''); // datetime-local string

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await appointmentsAPI.getAll(params);
      setItems(data.appointments || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total ?? data.count ?? (data.appointments?.length || 0));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);

  // Socket: auto-refresh and notify on relevant appointment events
  useEffect(() => {
    const onStatus = (payload) => {
      const appt = payload?.appointment;
      const custId = appt?.customer?._id || appt?.customer?.id;
      if (custId && user?.id && custId.toString() === user.id.toString()) {
        toast(`${(appt.serviceType || '').replace(/-/g, ' ')} is now ${payload.newStatus}`, { icon: '🔔' });
        load();
      }
    };

    const onAssigned = (payload) => {
      const appt = payload?.appointment;
      const custId = appt?.customer?._id || appt?.customer?.id;
      if (custId && user?.id && custId.toString() === user.id.toString()) {
        toast('Your appointment has been assigned to a technician', { icon: '👨‍🔧' });
        load();
      }
    };

    const onModRequest = (payload) => {
      // If current user is the one who requested, they already saw a toast from UI; skip.
      // Keep handler for completeness.
    };

    socketService.onAppointmentStatusChanged(onStatus);
    socketService.onAppointmentAssigned(onAssigned);
    socketService.onModificationRequest(onModRequest);

    return () => {
      socketService.off('appointment-status-changed', onStatus);
      socketService.off('appointment-assigned', onAssigned);
      socketService.off('modification-request', onModRequest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">{user?.role === 'admin' ? 'All Appointments' : user?.role === 'employee' ? 'My Assigned Appointments' : 'My Appointments'}</h1>
          <p className="text-sm text-gray-600">View, filter, and manage your service bookings.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Refresh</button>
          {user?.role === 'customer' && (
            <Link to="/appointments/book" className="bg-primary-blue text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-purple">Book Appointment</Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-parts">Waiting Parts</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple" />
          <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple" />
          <div className="md:col-span-2 flex gap-2">
            <button onClick={() => { setPage(1); load(); }} className="bg-primary-blue text-white rounded-lg px-4 py-2 hover:bg-primary-purple">Apply Filters</button>
            <button onClick={() => { setFilters({ status: '', startDate: '', endDate: '' }); setPage(1); load(); }} className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Reset</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <div className="text-gray-500 mb-2">No appointments found.</div>
          <Link to="/appointments/book" className="text-primary-blue hover:underline">Book your first appointment</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map(a => (
            <div key={a._id} className="bg-white rounded-xl shadow p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-lg font-semibold text-primary-dark">{(a.serviceType || '').replace(/-/g, ' ')}</div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="text-sm text-gray-700">{fmtDateTime(a.scheduledDate)}</div>
                {a.vehicle && (
                  <div className="text-sm text-gray-700 mt-1">{a.vehicle.make} {a.vehicle.model} • {a.vehicle.year} • {a.vehicle.licensePlate}</div>
                )}
                {a.description && <div className="text-sm text-gray-600 mt-2">{a.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                {canCancel(a.status) && (
                  <button onClick={() => cancel(a._id)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
                )}
                <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => openModify(a._id)}>Request Modification</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">Page {page} of {totalPages} • Total {total}</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModify && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-primary-dark mb-3">Request Modification</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea value={modifyReason} onChange={e => setModifyReason(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent" placeholder="Why do you need to change this appointment?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred New Date & Time (optional)</label>
                <input type="datetime-local" value={modifyDate} onChange={e => setModifyDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModify(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={submitModify} className="px-4 py-2 rounded-lg bg-primary-blue text-white hover:bg-primary-purple">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
