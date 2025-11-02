import express from 'express';
import Vehicle from '../models/Vehicle.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// List current user's vehicles (customers only by default)
router.get('/', authorize('customer', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const vehicles = await Vehicle.find(query).sort({ updatedAt: -1 });
    res.json({ vehicles, count: vehicles.length });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create vehicle (customer)
router.post('/', authorize('customer', 'admin'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role !== 'admin') data.owner = req.user._id;
    if (!data.owner) data.owner = req.user._id;

    const vehicle = new Vehicle(data);
    await vehicle.save();
    res.status(201).json({ message: 'Vehicle saved', vehicle });
  } catch (error) {
    console.error('Create vehicle error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A vehicle with this license plate already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vehicle (owner or admin)
router.put('/:id', authorize('customer', 'admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatable = ['nickname', 'make', 'model', 'year', 'licensePlate', 'vin', 'mileage'];
    updatable.forEach(k => {
      if (req.body[k] !== undefined) vehicle[k] = req.body[k];
    });

    await vehicle.save();
    res.json({ message: 'Vehicle updated', vehicle });
  } catch (error) {
    console.error('Update vehicle error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A vehicle with this license plate already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete vehicle (owner or admin)
router.delete('/:id', authorize('customer', 'admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
