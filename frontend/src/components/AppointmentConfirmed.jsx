import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { appointmentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const fmtDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const pretty = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function AppointmentConfirmed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await appointmentsAPI.getById(id);
        setAppointment(data.appointment);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load appointment');
        navigate('/appointments/my');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, navigate]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6 text-gray-600">Loading...</div>;
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-2xl font-bold text-primary-dark mb-2">Appointment Confirmed</div>
        <p className="text-gray-600 mb-6">We've booked your service. You'll receive updates here in the app.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-primary-light rounded p-4">
            <div className="text-sm text-gray-500">Service</div>
            <div className="font-semibold">{pretty(appointment.serviceType)}</div>
          </div>
          <div className="bg-primary-light rounded p-4">
            <div className="text-sm text-gray-500">Date & Time</div>
            <div className="font-semibold">{fmtDateTime(appointment.scheduledDate)}</div>
          </div>
          {appointment.vehicle && (
            <div className="bg-primary-light rounded p-4 md:col-span-2">
              <div className="text-sm text-gray-500">Vehicle</div>
              <div className="font-semibold">{appointment.vehicle.make} {appointment.vehicle.model} • {appointment.vehicle.year} • {appointment.vehicle.licensePlate}</div>
            </div>
          )}
          {appointment.description && (
            <div className="bg-primary-light rounded p-4 md:col-span-2">
              <div className="text-sm text-gray-500">Description</div>
              <div className="font-semibold">{appointment.description}</div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Link to="/appointments/my" className="px-4 py-2 rounded-lg bg-primary-blue text-white hover:bg-primary-purple">View My Appointments</Link>
          <Link to="/dashboard" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
