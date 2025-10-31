import express from 'express';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all appointments (for employees/admin) or user's appointments (for customers)
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Customers can only see their own appointments
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }
    
    // Apply filters
    const { status, startDate, endDate, assignedEmployee } = req.query;
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    
    if (assignedEmployee && req.user.role !== 'customer') {
      query.assignedEmployee = assignedEmployee;
    }
    
    // For employees, show appointments assigned to them if no specific filter
    if (req.user.role === 'employee' && !assignedEmployee) {
      query.assignedEmployee = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedEmployee', 'firstName lastName employeeId department')
      .sort({ scheduledDate: 1 });

    res.json({
      appointments,
      count: appointments.length
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedEmployee', 'firstName lastName employeeId department')
      .populate('notes.author', 'firstName lastName role')
      .populate('modificationRequests.requestedBy', 'firstName lastName')
      .populate('modificationRequests.respondedBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    // Authorization check
    if (req.user.role === 'customer' && appointment.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    res.json({ appointment });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      customer: req.user._id
    };

    // Validate scheduled date is in the future
    if (new Date(appointmentData.scheduledDate) < new Date()) {
      return res.status(400).json({ 
        message: 'Scheduled date must be in the future' 
      });
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    await appointment.populate('customer', 'firstName lastName email phone');

    // Emit real-time notification
    req.io.emit('new-appointment', {
      appointment,
      message: `New appointment created by ${req.user.firstName} ${req.user.lastName}`
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update appointment status (employees/admin only)
router.patch('/:id/status', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    // Add status change note
    if (notes) {
      appointment.notes.push({
        text: `Status changed from ${oldStatus} to ${status}. ${notes}`,
        author: req.user._id
      });
    }

    // Set start/end times based on status
    if (status === 'in-progress' && !appointment.startTime) {
      appointment.startTime = new Date();
    } else if (status === 'completed' && !appointment.endTime) {
      appointment.endTime = new Date();
    }

    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'assignedEmployee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time update
    req.io.emit('appointment-status-updated', {
      appointmentId: appointment._id,
      oldStatus,
      newStatus: status,
      appointment,
      updatedBy: req.user
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Assign employee to appointment (admin only)
router.patch('/:id/assign', authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    appointment.assignedEmployee = employeeId;
    
    appointment.notes.push({
      text: `Appointment assigned to employee`,
      author: req.user._id
    });

    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'assignedEmployee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time update
    req.io.emit('appointment-assigned', {
      appointment,
      assignedBy: req.user
    });

    res.json({
      message: 'Employee assigned successfully',
      appointment
    });

  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Request appointment modification (customers only)
router.post('/:id/modification-request', authorize('customer'), async (req, res) => {
  try {
    const { reason, newScheduledDate } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    // Check if user owns this appointment
    if (appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    // Add modification request
    appointment.modificationRequests.push({
      requestedBy: req.user._id,
      reason,
      newScheduledDate: newScheduledDate ? new Date(newScheduledDate) : undefined
    });

    await appointment.save();

    // Emit real-time notification
    req.io.emit('modification-request', {
      appointmentId: appointment._id,
      customer: req.user,
      reason,
      newScheduledDate
    });

    res.json({
      message: 'Modification request submitted successfully'
    });

  } catch (error) {
    console.error('Modification request error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Add note to appointment
router.post('/:id/notes', async (req, res) => {
  try {
    const { text } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    // Authorization check for customers
    if (req.user.role === 'customer' && appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    appointment.notes.push({
      text,
      author: req.user._id
    });

    await appointment.save();

    await appointment.populate('notes.author', 'firstName lastName role');

    res.json({
      message: 'Note added successfully',
      note: appointment.notes[appointment.notes.length - 1]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export default router;
