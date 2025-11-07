import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, PencilIcon, EyeIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// Header is provided by App layout (role-aware)
import LoadingSpinner from './LoadingSpinner';
import VehicleForm from './VehicleForm';
import { vehiclesAPI } from '../utils/api';

const MyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      params.sort = sortBy;
      params.order = sortOrder;

      const response = await vehiclesAPI.getAll(params);
      if (response.data.success) {
        setVehicles(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      toast.error('Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowAddForm(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await vehiclesAPI.delete(vehicleToDelete._id);
      if (response.data.success) {
        toast.success('Vehicle deleted successfully');
        fetchVehicles();
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Error deleting vehicle');
    } finally {
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
    }
  };

  const handleVehicleSubmit = () => {
    setShowAddForm(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getEngineTypeIcon = (engineType) => {
    switch (engineType) {
      case 'electric':
        return '🔋';
      case 'hybrid':
        return '⚡';
      case 'diesel':
        return '⛽';
      default:
        return '🚗';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header provided by App layout */}
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Vehicles
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your registered vehicles and view service history
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleAddVehicle}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Sort by Date Added</option>
                <option value="make">Sort by Make</option>
                <option value="year">Sort by Year</option>
                <option value="mileage">Sort by Mileage</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              🚗
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first vehicle.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddVehicle}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Vehicle
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                {/* Vehicle Image */}
                <div className="h-48 bg-gray-200 relative">
                  {vehicle.imageUrl ? (
                    <img
                      src={vehicle.imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full ${vehicle.imageUrl ? 'hidden' : 'flex'} items-center justify-center text-6xl`}
                    style={{ display: vehicle.imageUrl ? 'none' : 'flex' }}
                  >
                    {getEngineTypeIcon(vehicle.engineType)}
                  </div>
                  
                  {/* Engine Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.engineType === 'electric' ? 'bg-green-100 text-green-800' :
                      vehicle.engineType === 'hybrid' ? 'bg-blue-100 text-blue-800' :
                      vehicle.engineType === 'diesel' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.engineType}
                    </span>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                  </div>
                  
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">License Plate</dt>
                      <dd className="text-gray-900 font-medium">{vehicle.licensePlate}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Color</dt>
                      <dd className="text-gray-900">{vehicle.color}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Mileage</dt>
                      <dd className="text-gray-900">{vehicle.mileage?.toLocaleString()} mi</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Services</dt>
                      <dd className="text-gray-900">{vehicle.serviceCount || 0}</dd>
                    </div>
                  </dl>

                  {/* Last Service */}
                  <div className="mt-4 text-sm">
                    <span className="text-gray-500">Last Service: </span>
                    <span className="text-gray-900">{formatDate(vehicle.lastServiceDate)}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle._id}/history`)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      History
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Vehicle Modal */}
        {showAddForm && (
          <VehicleForm
            vehicle={editingVehicle}
            onSubmit={handleVehicleSubmit}
            onCancel={() => {
              setShowAddForm(false);
              setEditingVehicle(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Vehicle</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{vehicleToDelete?.year} {vehicleToDelete?.make} {vehicleToDelete?.model}</strong>?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setVehicleToDelete(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyVehicles;
