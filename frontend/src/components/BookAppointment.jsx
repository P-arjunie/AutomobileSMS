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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import { vehiclesAPI, appointmentsAPI } from '../utils/api';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    scheduledDate: '',
    scheduledTime: '',
    description: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});

  const serviceTypes = [
    { value: 'oil-change', label: 'Oil Change' },
    { value: 'brake-service', label: 'Brake Service' },
    { value: 'tire-rotation', label: 'Tire Rotation' },
    { value: 'engine-diagnostic', label: 'Engine Diagnostic' },
    { value: 'transmission-service', label: 'Transmission Service' },
    { value: 'air-conditioning', label: 'Air Conditioning' },
    { value: 'battery-service', label: 'Battery Service' },
    { value: 'general-inspection', label: 'General Inspection' },
    { value: 'bodywork', label: 'Bodywork' },
    { value: 'painting', label: 'Painting' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesAPI.getAll();
      if (response.data.success) {
        setVehicles(response.data.data);
      } else {
        toast.error('Failed to load vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Please select a vehicle';
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select a service type';
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Date cannot be in the past';
      }
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSubmitting(true);

    try {
      // Find the selected vehicle to get its details
      const selectedVehicle = vehicles.find(v => v._id === formData.vehicleId);
      
      if (!selectedVehicle) {
        toast.error('Selected vehicle not found');
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const appointmentData = {
        vehicleId: formData.vehicleId, // Reference to the vehicle document
        vehicle: {
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          licensePlate: selectedVehicle.licensePlate,
          vin: selectedVehicle.vin,
          mileage: selectedVehicle.mileage
        },
        serviceType: formData.serviceType,
        scheduledDate: scheduledDateTime.toISOString(),
        description: formData.description || undefined,
        priority: formData.priority
      };

      const response = await appointmentsAPI.create(appointmentData);
      
      if (response.data.message || response.status === 201) {
        toast.success('Appointment booked successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else {
        toast.error('Error booking appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v._id === formData.vehicleId);

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: time, label });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
            Book Service Appointment
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule a service appointment for your vehicle
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles registered</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to register a vehicle before booking an appointment.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/vehicles')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Vehicle
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle *
                </label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.vehicleId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Select a vehicle --</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId}</p>}
              </div>

              {/* Selected Vehicle Info */}
              {selectedVehicle && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Vehicle</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Make/Model:</span>
                      <span className="ml-2 text-blue-900">{selectedVehicle.make} {selectedVehicle.model}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Year:</span>
                      <span className="ml-2 text-blue-900">{selectedVehicle.year}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">License Plate:</span>
                      <span className="ml-2 text-blue-900">{selectedVehicle.licensePlate}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Mileage:</span>
                      <span className="ml-2 text-blue-900">{selectedVehicle.mileage?.toLocaleString()} mi</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.serviceType ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Select service type --</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                      errors.scheduledDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                      errors.scheduledTime ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">-- Select time --</option>
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  {errors.scheduledTime && <p className="text-red-500 text-xs mt-1">{errors.scheduledTime}</p>}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description / Special Instructions
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Describe the issue or any special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookAppointment;
