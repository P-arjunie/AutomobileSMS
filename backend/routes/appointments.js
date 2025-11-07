import express from 'express';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Get available time slots for a given date and service type
// Query: date=YYYY-MM-DD, serviceType=oil-change, intervalMinutes=30 (optional)
router.get('/available-slots', async (req, res) => {
  try {
    const { date, serviceType, intervalMinutes } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });
    }

    // Business hours configuration
    const SLOT_INTERVAL = parseInt(intervalMinutes, 10) || 30; // minutes
    const BUSINESS_START_HOUR = 9; // 9 AM
    const BUSINESS_END_HOUR = 17; // 5 PM

    // Map service types to default estimated durations (in hours)
    const TYPE_DURATION_HOURS = {
      'oil-change': 1,
      'brake-service': 2,
      'tire-rotation': 1,
      'engine-diagnostic': 2,
      'transmission-service': 3,
      'air-conditioning': 2,
      'battery-service': 1,
      'general-inspection': 1,
      'bodywork': 4,
      'painting': 4,
      'other': 2
    };

    const estDurationHours = TYPE_DURATION_HOURS[serviceType] || 2;

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Fetch existing appointments for the day (excluding cancelled)
    const existing = await Appointment.find({
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'cancelled' }
    }).select('scheduledDate estimatedDuration');

    // Build blocked windows as [start, end) in ms
    const blocked = existing.map(a => {
      const start = new Date(a.scheduledDate).getTime();
      const durHrs = a.estimatedDuration || 2;
      const end = start + durHrs * 60 * 60 * 1000;
      return [start, end];
    });

    // Helper to check overlap
    const overlaps = (startMs, endMs) => {
      return blocked.some(([bStart, bEnd]) => Math.max(bStart, startMs) < Math.min(bEnd, endMs));
    };

    // Generate candidate slots within business hours
    const slots = [];
    const businessStart = new Date(dayStart);
    businessStart.setUTCHours(BUSINESS_START_HOUR, 0, 0, 0);
    const businessEnd = new Date(dayStart);
    businessEnd.setUTCHours(BUSINESS_END_HOUR, 0, 0, 0);

    const slotMs = SLOT_INTERVAL * 60 * 1000;
    const durationMs = estDurationHours * 60 * 60 * 1000;
    for (let t = businessStart.getTime(); t + durationMs <= businessEnd.getTime(); t += slotMs) {
      const end = t + durationMs;
      if (!overlaps(t, end)) {
        slots.push(new Date(t).toISOString());
      }
    }

    return res.json({
      date,
      serviceType: serviceType || null,
      intervalMinutes: SLOT_INTERVAL,
      estimatedDurationHours: estDurationHours,
      availableSlots: slots
    });
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

    // Prevent double booking: check if the selected slot overlaps with existing appointments
    const desiredStart = new Date(appointmentData.scheduledDate);
    const durationHours = appointmentData.estimatedDuration || 2;
    const desiredEnd = new Date(desiredStart.getTime() + durationHours * 60 * 60 * 1000);

    const dayStart = new Date(desiredStart);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(desiredStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const sameDayAppointments = await Appointment.find({
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'cancelled' }
    }).select('scheduledDate estimatedDuration');

    const desiredStartMs = desiredStart.getTime();
    const desiredEndMs = desiredEnd.getTime();
    const conflict = sameDayAppointments.some(a => {
      const start = new Date(a.scheduledDate).getTime();
      const end = start + (a.estimatedDuration || 2) * 60 * 60 * 1000;
      return Math.max(start, desiredStartMs) < Math.min(end, desiredEndMs);
    });

    if (conflict) {
      return res.status(409).json({ message: 'Selected time slot is no longer available' });
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
    req.io.emit('appointment-status-changed', {
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

// Cancel appointment (customer can cancel own, admin can cancel any)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const isOwner = appointment.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Only pending or confirmed appointments can be cancelled' });
    }

    const oldStatus = appointment.status;
    appointment.status = 'cancelled';
    appointment.endTime = new Date();
    appointment.notes.push({
      text: `Appointment cancelled by ${isAdmin ? 'admin' : 'customer'}`,
      author: req.user._id
    });
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'assignedEmployee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time event
    req.io.emit('appointment-status-changed', {
      appointmentId: appointment._id,
      oldStatus,
      newStatus: 'cancelled',
      appointment,
      cancelledBy: req.user
    });

    return res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
