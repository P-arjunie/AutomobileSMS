import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/vehicles - Get all vehicles for logged-in customer
router.get('/', async (req, res) => {
  try {
    const { search, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Only customers can access their own vehicles
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only customers can access vehicles.'
      });
    }

    const options = {
      search,
      sort: { [sort]: order === 'desc' ? -1 : 1 }
    };

    const vehicles = await Vehicle.findByCustomer(req.user.id, options)
      .populate('customerId', 'firstName lastName email');

    // Add service statistics for each vehicle
    const vehiclesWithStats = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleObj = vehicle.toObject();
        vehicleObj.serviceCount = await vehicle.getServiceCount();
        vehicleObj.lastServiceDate = await vehicle.getLastServiceDate();
        return vehicleObj;
      })
    );

    res.json({
      success: true,
      data: vehiclesWithStats,
      count: vehiclesWithStats.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
});

// POST /api/vehicles - Add new vehicle
router.post('/', async (req, res) => {
  try {
    // Only customers can add vehicles
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only customers can add vehicles.'
      });
    }

    const vehicleData = {
      ...req.body,
      customerId: req.user.id
    };

    // Validate required fields
    const requiredFields = ['make', 'model', 'year', 'licensePlate', 'vin', 'color', 'mileage'];
    const missingFields = requiredFields.filter(field => !vehicleData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate license plate
    const existingByPlate = await Vehicle.findOne({ 
      licensePlate: vehicleData.licensePlate.toUpperCase(),
      isActive: true 
    });
    
    if (existingByPlate) {
      return res.status(400).json({
        success: false,
        message: 'A vehicle with this license plate already exists'
      });
    }

    // Check for duplicate VIN
    const existingByVin = await Vehicle.findOne({ 
      vin: vehicleData.vin.toUpperCase(),
      isActive: true 
    });
    
    if (existingByVin) {
      return res.status(400).json({
        success: false,
        message: 'A vehicle with this VIN already exists'
      });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('customerId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedVehicle,
      message: 'Vehicle added successfully'
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A vehicle with this ${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding vehicle',
      error: error.message
    });
  }
});

// GET /api/vehicles/:id - Get specific vehicle details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id)
      .populate('customerId', 'firstName lastName email');

    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check ownership for customers
    if (req.user.role === 'customer' && !vehicle.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own vehicles.'
      });
    }

    // Add service statistics
    const vehicleObj = vehicle.toObject();
    vehicleObj.serviceCount = await vehicle.getServiceCount();
    vehicleObj.lastServiceDate = await vehicle.getLastServiceDate();

    res.json({
      success: true,
      data: vehicleObj
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
});

// PUT /api/vehicles/:id - Update vehicle information
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check ownership for customers
    if (req.user.role === 'customer' && !vehicle.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own vehicles.'
      });
    }

    // Prevent updating customerId
    const updateData = { ...req.body };
    delete updateData.customerId;

    // Check for duplicate license plate (excluding current vehicle)
    if (updateData.licensePlate) {
      const existingByPlate = await Vehicle.findOne({ 
        licensePlate: updateData.licensePlate.toUpperCase(),
        _id: { $ne: id },
        isActive: true 
      });
      
      if (existingByPlate) {
        return res.status(400).json({
          success: false,
          message: 'A vehicle with this license plate already exists'
        });
      }
    }

    // Check for duplicate VIN (excluding current vehicle)
    if (updateData.vin) {
      const existingByVin = await Vehicle.findOne({ 
        vin: updateData.vin.toUpperCase(),
        _id: { $ne: id },
        isActive: true 
      });
      
      if (existingByVin) {
        return res.status(400).json({
          success: false,
          message: 'A vehicle with this VIN already exists'
        });
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email');

    res.json({
      success: true,
      data: updatedVehicle,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A vehicle with this ${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message
    });
  }
});

// DELETE /api/vehicles/:id - Permanently delete vehicle from database
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check ownership for customers
    if (req.user.role === 'customer' && !vehicle.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own vehicles.'
      });
    }

    // Check if vehicle has active appointments
    const activeAppointments = await Appointment.countDocuments({
      vehicleId: id,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'waiting-parts'] }
    });

    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active appointments. Please complete or cancel them first.'
      });
    }

    // Permanently delete the vehicle from database
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);

    if (!deletedVehicle) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle. Vehicle not found.'
      });
    }

    console.log(`Vehicle ${id} permanently deleted from database.`);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: { id: deletedVehicle._id }
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/vehicles/:id/history - Get service history for a vehicle
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check ownership for customers
    if (req.user.role === 'customer' && !vehicle.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own vehicle history.'
      });
    }

    // Build query
    const query = { vehicleId: id };
    if (status) {
      query.status = status;
    }

    // Get appointments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / parseInt(limit));

    res.json({
      success: true,
      data: {
        vehicle: vehicle,
        appointments: appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAppointments,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle history',
      error: error.message
    });
  }
});

export default router;
