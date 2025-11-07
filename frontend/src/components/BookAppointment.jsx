import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { appointmentsAPI, servicesAPI } from '../utils/api';

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
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
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
      navigate(`/appointments/my`);
    } catch (e) {
      const serverMsg = e.response?.data?.message;
      const firstDetail = Array.isArray(e.response?.data?.errors) ? e.response.data.errors[0] : undefined;
      toast.error(firstDetail || serverMsg || 'Booking failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary-blue/30 to-primary-purple/40 py-8 px-4">
      {/* Header provided by App layout */}
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-purple">
              Book an Appointment
            </h1>
            <p className="text-sm text-gray-600 mt-2">Choose your service, pick a time, and provide vehicle details.</p>
          </div>
          <Link 
            to="/appointments/my" 
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition text-primary-blue hover:text-primary-dark border border-primary-blue/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Appointments
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Service Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-purple rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Service Details</h2>
                  <p className="text-sm text-gray-600">Select service type and schedule</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type</label>
                    <select
                      name="serviceType"
                      value={form.serviceType}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
                      required
                    >
                      <option value="" disabled>{loadingTypes ? 'Loading...' : 'Select a service'}</option>
                      {serviceTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.displayName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={dateOnly}
                      onChange={e => { setDateOnly(e.target.value); setForm(f => ({ ...f, scheduledDate: '' })); }}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time Slot</label>
                    <select
                      value={form.scheduledDate}
                      onChange={e => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                      disabled={!dateOnly || !form.serviceType || loadingSlots}
                      required
                    >
                      <option value="" disabled>{loadingSlots ? 'Loading...' : 'Select a slot'}</option>
                      {availableSlots.map(s => (
                        <option key={s} value={s}>{fmtTime(s)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select 
                      name="priority" 
                      value={form.priority} 
                      onChange={handleChange} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="Describe the issue or requested service..."
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Vehicle Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
                  <p className="text-sm text-gray-600">Provide your vehicle information</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                    <input 
                      name="vehicle.make" 
                      value={form.vehicle.make} 
                      onChange={handleChange} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition" 
                      placeholder="e.g., Toyota"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                    <input 
                      name="vehicle.model" 
                      value={form.vehicle.model} 
                      onChange={handleChange} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
                      placeholder="e.g., Camry"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                    <input 
                      type="number" 
                      name="vehicle.year" 
                      value={form.vehicle.year} 
                      onChange={handleChange} 
                      min={1900} 
                      max={currentYear + 1} 
                      step={1} 
                      inputMode="numeric" 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
                      placeholder={currentYear.toString()}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate</label>
                    <input 
                      name="vehicle.licensePlate" 
                      value={form.vehicle.licensePlate} 
                      onChange={handleChange} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition uppercase" 
                      placeholder="e.g., ABC-1234"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">VIN <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input 
                      name="vehicle.vin" 
                      value={form.vehicle.vin} 
                      onChange={handleChange} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input 
                      type="number" 
                      name="vehicle.mileage" 
                      value={form.vehicle.mileage} 
                      onChange={handleChange} 
                      min={0} 
                      step={1} 
                      inputMode="numeric" 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
                      placeholder="Current mileage"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-primary-blue to-primary-purple text-white py-3 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                  >
                    Book Appointment
                  </button>
                  <Link 
                    to="/appointments/my" 
                    className="flex-1 text-center border-2 border-gray-200 rounded-xl py-3 font-semibold hover:bg-gray-50 transition"
                  >
                    View My Appointments
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Summary Card */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="bg-gradient-to-br from-primary-blue to-primary-purple rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Booking Summary
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Service:</span> 
                  <span className="font-semibold">{serviceTypes.find(t => t.id === form.serviceType)?.displayName || '-'}</span>
                </li>
                <li className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Date:</span> 
                  <span className="font-semibold">{dateOnly || '-'}</span>
                </li>
                <li className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Time:</span> 
                  <span className="font-semibold">{form.scheduledDate ? fmtTime(form.scheduledDate) : '-'}</span>
                </li>
                {selectedTypeMeta && (
                  <>
                    <li className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-blue-100">Duration:</span> 
                      <span className="font-semibold">{selectedTypeMeta.estimatedDuration} hr</span>
                    </li>
                    <li className="flex justify-between items-center py-2">
                      <span className="text-blue-100">Base Price:</span> 
                      <span className="font-bold text-xl">${selectedTypeMeta.basePrice}</span>
                    </li>
                  </>
                )}
              </ul>
              <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-xl text-xs">
                <p className="flex items-start">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Final details can be adjusted with our staff upon check-in.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}