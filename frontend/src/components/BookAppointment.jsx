import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { appointmentsAPI, servicesAPI, vehiclesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    serviceType: '',
    scheduledDate: '', // ISO string for slot chosen
    description: '',
    priority: 'medium',
    vehicle: {
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      mileage: ''
    }
  });

  const [dateOnly, setDateOnly] = useState(''); // YYYY-MM-DD
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [useSaved, setUseSaved] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Load service types
  useEffect(() => {
    let mounted = true;
    const loadTypes = async () => {
      try {
        setLoadingTypes(true);
        const { data } = await servicesAPI.getTypes();
        if (mounted) setServiceTypes(data.types || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load service types');
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypes();
    return () => { mounted = false; };
  }, []);

  // Load saved vehicles (customers)
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        if (user?.role !== 'customer') return;
        const { data } = await vehiclesAPI.getAll();
        setSavedVehicles(data.vehicles || []);
        if ((data.vehicles || []).length > 0) {
          setUseSaved(true);
        } else {
          setUseSaved(false);
        }
      } catch (e) {
        // Non-blocking
      }
    };
    loadVehicles();
  }, [user?.role]);

  // Load available slots when date or serviceType changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!dateOnly || !form.serviceType) {
        setAvailableSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        const { data } = await appointmentsAPI.getAvailableSlots({
          date: dateOnly,
          serviceType: form.serviceType,
        });
        setAvailableSlots(data.availableSlots || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load available slots');
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [dateOnly, form.serviceType]);

  const selectedTypeMeta = useMemo(() => serviceTypes.find(t => t.id === form.serviceType), [serviceTypes, form.serviceType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ ...prev, vehicle: { ...prev.vehicle, [key]: value } }));
      setUseSaved(false);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const onSelectSavedVehicle = (id) => {
    setSelectedVehicleId(id);
    const v = savedVehicles.find(x => x._id === id);
    if (v) {
      setForm(prev => ({
        ...prev,
        vehicle: {
          make: v.make,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate,
          vin: v.vin || '',
          mileage: typeof v.mileage === 'number' ? String(v.mileage) : ''
        }
      }));
      setUseSaved(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.scheduledDate) {
        toast.error('Please select a time slot');
        return;
      }
      // Basic validation
      const requiredVehicle = ['make','model','year','licensePlate'];
      const missing = requiredVehicle.filter(k => !String(form.vehicle[k] || '').trim());
      if (missing.length) {
        toast.error('Please fill vehicle details: ' + missing.join(', '));
        return;
      }

      // Validate year boundaries explicitly
      const yr = Number(form.vehicle.year);
      if (!Number.isInteger(yr) || yr < 1900 || yr > currentYear + 1) {
        toast.error(`Please enter a valid vehicle year between 1900 and ${currentYear + 1}`);
        return;
      }

      // Validate mileage if provided
      if (String(form.vehicle.mileage).trim() !== '') {
        const miles = Number(form.vehicle.mileage);
        if (!Number.isFinite(miles) || miles < 0) {
          toast.error('Mileage must be a non-negative number');
          return;
        }
      }

      const payload = {
        serviceType: form.serviceType,
        scheduledDate: form.scheduledDate,
        description: form.description,
        priority: form.priority,
        vehicle: {
          make: form.vehicle.make,
          model: form.vehicle.model,
          year: yr,
          licensePlate: String(form.vehicle.licensePlate).toUpperCase().trim(),
          vin: form.vehicle.vin || undefined,
          mileage: String(form.vehicle.mileage).trim() !== '' ? Number(form.vehicle.mileage) : undefined,
        },
        estimatedDuration: selectedTypeMeta?.estimatedDuration || 2,
        estimatedCost: selectedTypeMeta?.basePrice ?? 0,
      };

      const { data } = await appointmentsAPI.create(payload);
      toast.success('Appointment booked');
      const id = data?.appointment?._id || data?.appointment?.id || data?.id;
      if (id) {
        navigate(`/appointments/confirm/${id}`);
      } else {
        navigate(`/appointments/my`);
      }
    } catch (e) {
      const serverMsg = e.response?.data?.message;
      const firstDetail = Array.isArray(e.response?.data?.errors) ? e.response.data.errors[0] : undefined;
      toast.error(firstDetail || serverMsg || 'Booking failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Book an Appointment</h1>
          <p className="text-sm text-gray-600">Choose your service, pick a time, and provide vehicle details.</p>
        </div>
        <Link to="/appointments/my" className="text-sm text-primary-blue hover:underline">My Appointments</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                  required
                >
                  <option value="" disabled>{loadingTypes ? 'Loading...' : 'Select a service'}</option>
                  {serviceTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={dateOnly}
                    onChange={e => { setDateOnly(e.target.value); setForm(f => ({ ...f, scheduledDate: '' })); }}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                  <select
                    value={form.scheduledDate}
                    onChange={e => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                    disabled={!dateOnly || !form.serviceType || loadingSlots}
                    required
                  >
                    <option value="" disabled>{loadingSlots ? 'Loading...' : 'Select a slot'}</option>
                    {availableSlots.map(s => (
                      <option key={s} value={s}>{fmtTime(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Issue Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                  placeholder="Describe the issue or requested service"
                  required
                />
              </div>
            </div>
          </form>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 mt-6">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">Vehicle Details</h2>
            {/* Saved vehicles selector */}
            {user?.role === 'customer' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Use Saved Vehicle</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={useSaved} onChange={e => setUseSaved(e.target.checked)} disabled={savedVehicles.length === 0} />
                      Use from my vehicles
                    </label>
                    <Link to="/vehicles" className="text-sm text-primary-blue hover:underline">Manage Vehicles</Link>
                  </div>
                </div>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                  disabled={!useSaved || savedVehicles.length === 0}
                  value={selectedVehicleId}
                  onChange={e => onSelectSavedVehicle(e.target.value)}
                >
                  <option value="">{savedVehicles.length ? 'Select a saved vehicle' : 'No saved vehicles'}</option>
                  {savedVehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {(v.nickname ? `${v.nickname} • ` : '') + `${v.make} ${v.model} • ${v.year} • ${v.licensePlate}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input name="vehicle.make" value={form.vehicle.make} onChange={handleChange} disabled={useSaved} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input name="vehicle.model" value={form.vehicle.model} onChange={handleChange} disabled={useSaved} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input type="number" name="vehicle.year" value={form.vehicle.year} onChange={handleChange} disabled={useSaved} min={1900} max={currentYear + 1} step={1} inputMode="numeric" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Plate</label>
                <input name="vehicle.licensePlate" value={form.vehicle.licensePlate} onChange={handleChange} disabled={useSaved} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">VIN (optional)</label>
                <input name="vehicle.vin" value={form.vehicle.vin} onChange={handleChange} disabled={useSaved} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mileage (optional)</label>
                <input type="number" name="vehicle.mileage" value={form.vehicle.mileage} onChange={handleChange} disabled={useSaved} min={0} step={1} inputMode="numeric" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent disabled:bg-gray-100" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" className="flex-1 bg-primary-blue text-white py-2 rounded-lg hover:bg-primary-purple transition">Book Appointment</button>
              <Link to="/appointments/my" className="flex-1 text-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">My Appointments</Link>
            </div>
          </form>
        </div>

        <aside className="bg-white rounded-xl shadow p-5 h-fit">
          <h3 className="text-base font-semibold text-primary-dark mb-3">Summary</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li><span className="text-gray-500">Service:</span> {serviceTypes.find(t => t.id === form.serviceType)?.displayName || '-'}</li>
            <li><span className="text-gray-500">Date:</span> {dateOnly || '-'}</li>
            <li><span className="text-gray-500">Time:</span> {form.scheduledDate ? fmtTime(form.scheduledDate) : '-'}</li>
            {selectedTypeMeta && (
              <>
                <li><span className="text-gray-500">Est. Duration:</span> {selectedTypeMeta.estimatedDuration} hr</li>
                <li><span className="text-gray-500">Base Price:</span> ${selectedTypeMeta.basePrice}</li>
              </>
            )}
          </ul>
          <div className="mt-4 p-3 bg-primary-light rounded text-xs text-primary-dark">You can adjust final details with our staff upon check-in.</div>
        </aside>
      </div>
    </div>
  );
}
