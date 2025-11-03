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
