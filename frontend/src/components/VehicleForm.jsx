import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { vehiclesAPI } from '../utils/api';

const VehicleForm = ({ vehicle, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    color: '',
    mileage: '',
    engineType: 'gasoline',
    transmission: 'automatic',
    fuelCapacity: '',
    imageUrl: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        licensePlate: vehicle.licensePlate || '',
        vin: vehicle.vin || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage || '',
        engineType: vehicle.engineType || 'gasoline',
        transmission: vehicle.transmission || 'automatic',
        fuelCapacity: vehicle.fuelCapacity || '',
        imageUrl: vehicle.imageUrl || '',
        notes: vehicle.notes || ''
      });
      setImagePreview(vehicle.imageUrl || '');
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
    if (!formData.vin.trim()) newErrors.vin = 'VIN is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    if (!formData.mileage) newErrors.mileage = 'Mileage is required';

    // Year validation
    const currentYear = new Date().getFullYear();
    if (formData.year < 1900 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }

    // License plate validation
    if (formData.licensePlate && formData.licensePlate.length > 20) {
      newErrors.licensePlate = 'License plate cannot exceed 20 characters';
    }

    // VIN validation
    if (formData.vin) {
      const cleanVin = formData.vin.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
      if (cleanVin.length !== 17) {
        newErrors.vin = 'VIN must be exactly 17 characters';
      } else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
        newErrors.vin = 'VIN contains invalid characters (no I, O, Q allowed)';
      }
    }

    // Mileage validation
    if (formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    } else if (formData.mileage > 999999) {
      newErrors.mileage = 'Mileage seems unrealistic';
    }

    // Fuel capacity validation
    if (formData.fuelCapacity && (formData.fuelCapacity < 1 || formData.fuelCapacity > 200)) {
      newErrors.fuelCapacity = 'Fuel capacity must be between 1 and 200 gallons';
    }

    // Image URL validation
    if (formData.imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.imageUrl)) {
      newErrors.imageUrl = 'Please provide a valid image URL';
    }

    // Notes validation
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
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

    // Update image preview for imageUrl
    if (name === 'imageUrl') {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      // Convert string numbers to actual numbers
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined
      };

      // Remove empty optional fields
      if (!submitData.fuelCapacity) delete submitData.fuelCapacity;
      if (!submitData.imageUrl) delete submitData.imageUrl;
      if (!submitData.notes) delete submitData.notes;

      const response = vehicle 
        ? await vehiclesAPI.update(vehicle._id, submitData)
        : await vehiclesAPI.create(submitData);

      if (response.data.success) {
        toast.success(response.data.message || `Vehicle ${vehicle ? 'updated' : 'added'} successfully`);
        onSubmit();
      } else {
        if (response.data.errors && Array.isArray(response.data.errors)) {
          response.data.errors.forEach(error => toast.error(error));
        } else {
          toast.error(response.data.message || `Failed to ${vehicle ? 'update' : 'add'} vehicle`);
        }
      }
    } catch (error) {
      console.error('Error submitting vehicle:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="e.g., Toyota, Honda, Ford"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.make ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., Camry, Civic, F-150"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.model ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.year ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Red, Blue, Silver"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.color ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
              </div>
            </div>
          </div>

          {/* Identification */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Identification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC-1234"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.licensePlate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.licensePlate && <p className="text-red-500 text-xs mt-1">{errors.licensePlate}</p>}
              </div>

              {/* VIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN *
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  placeholder="17-character VIN"
                  maxLength="17"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.vin ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.vin && <p className="text-red-500 text-xs mt-1">{errors.vin}</p>}
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Technical Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage *
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  placeholder="Current mileage"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.mileage ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.mileage && <p className="text-red-500 text-xs mt-1">{errors.mileage}</p>}
              </div>

              {/* Engine Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Type
                </label>
                <select
                  name="engineType"
                  value={formData.engineType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission
                </label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                </select>
              </div>

              {/* Fuel Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Capacity (gallons)
                </label>
                <input
                  type="number"
                  name="fuelCapacity"
                  value={formData.fuelCapacity}
                  onChange={handleInputChange}
                  placeholder="Tank capacity"
                  min="1"
                  max="200"
                  step="0.1"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                    errors.fuelCapacity ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.fuelCapacity && <p className="text-red-500 text-xs mt-1">{errors.fuelCapacity}</p>}
              </div>
            </div>
          </div>

          {/* Optional Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Optional Information</h4>
            
            {/* Image URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/vehicle-image.jpg"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.imageUrl ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Preview
                </label>
                <div className="h-32 w-48 border border-gray-300 rounded-md overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Vehicle preview"
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview('')}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the vehicle..."
                rows="3"
                maxLength="500"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.notes ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 characters</p>
              {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
