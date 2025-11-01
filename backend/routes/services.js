import express from 'express';
import ServiceLog from '../models/ServiceLog.js';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Get available service types with metadata
router.get('/types', async (req, res) => {
  try {
    const enumValues = Appointment.schema.path('serviceType').enumValues || [];

    // Provide display names, estimated duration and base price hints
    const meta = {
      'oil-change': { name: 'Oil Change', estimatedDuration: 1, basePrice: 40 },
      'brake-service': { name: 'Brake Service', estimatedDuration: 2, basePrice: 150 },
      'tire-rotation': { name: 'Tire Rotation', estimatedDuration: 1, basePrice: 30 },
      'engine-diagnostic': { name: 'Engine Diagnostic', estimatedDuration: 2, basePrice: 100 },
      'transmission-service': { name: 'Transmission Service', estimatedDuration: 3, basePrice: 300 },
      'air-conditioning': { name: 'Air Conditioning', estimatedDuration: 2, basePrice: 180 },
      'battery-service': { name: 'Battery Service', estimatedDuration: 1, basePrice: 80 },
      'general-inspection': { name: 'General Inspection', estimatedDuration: 1, basePrice: 50 },
      'bodywork': { name: 'Bodywork', estimatedDuration: 4, basePrice: 500 },
      'painting': { name: 'Painting', estimatedDuration: 4, basePrice: 600 },
      'other': { name: 'Other', estimatedDuration: 2, basePrice: 0 }
    };

    const types = enumValues.map(v => ({
      id: v,
      key: v,
      displayName: meta[v]?.name || v,
      estimatedDuration: meta[v]?.estimatedDuration || 2,
      basePrice: meta[v]?.basePrice ?? 0
    }));

    res.json({ types, count: types.length });
  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get service logs
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Employees can see their own service logs
    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    }
    
    // Customers can see service logs for their appointments
    if (req.user.role === 'customer') {
      const customerAppointments = await Appointment.find({ customer: req.user._id }).select('_id');
      const appointmentIds = customerAppointments.map(app => app._id);
      query.appointment = { $in: appointmentIds };
    }

    // Apply filters
    const { appointmentId, status, startDate, endDate } = req.query;
    
    if (appointmentId) {
      query.appointment = appointmentId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const serviceLogs = await ServiceLog.find(query)
      .populate('appointment', 'vehicle serviceType status customer')
      .populate('employee', 'firstName lastName employeeId department')
      .populate('appointment.customer', 'firstName lastName')
      .sort({ startTime: -1 });

    res.json({
      serviceLogs,
      count: serviceLogs.length
    });

  } catch (error) {
    console.error('Get service logs error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get single service log
router.get('/:id', async (req, res) => {
  try {
    const serviceLog = await ServiceLog.findById(req.params.id)
      .populate('appointment', 'vehicle serviceType status customer')
      .populate('employee', 'firstName lastName employeeId department')
      .populate('appointment.customer', 'firstName lastName');

    if (!serviceLog) {
      return res.status(404).json({ 
        message: 'Service log not found' 
      });
    }

    // Authorization check
    if (req.user.role === 'customer') {
      if (serviceLog.appointment.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Access denied' 
        });
      }
    } else if (req.user.role === 'employee') {
      if (serviceLog.employee._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Access denied' 
        });
      }
    }

    res.json({ serviceLog });

  } catch (error) {
    console.error('Get service log error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Create new service log (employees only)
router.post('/', authorize('employee', 'admin'), async (req, res) => {
  try {
    const serviceLogData = {
      ...req.body,
      employee: req.user._id
    };

    // Verify appointment exists and employee has access
    const appointment = await Appointment.findById(serviceLogData.appointment);
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Appointment not found' 
      });
    }

    // Check if employee is assigned to this appointment (unless admin)
    if (req.user.role === 'employee' && 
        appointment.assignedEmployee && 
        appointment.assignedEmployee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You are not assigned to this appointment' 
      });
    }

    const serviceLog = new ServiceLog(serviceLogData);
    await serviceLog.save();

    await serviceLog.populate([
      { path: 'appointment', select: 'vehicle serviceType status' },
      { path: 'employee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time notification
    req.io.emit('service-log-created', {
      serviceLog,
      employee: req.user
    });

    res.status(201).json({
      message: 'Service log created successfully',
      serviceLog
    });

  } catch (error) {
    console.error('Create service log error:', error);
    
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

// Update service log (employees only - their own logs)
router.put('/:id', authorize('employee', 'admin'), async (req, res) => {
  try {
    const serviceLog = await ServiceLog.findById(req.params.id);
    
    if (!serviceLog) {
      return res.status(404).json({ 
        message: 'Service log not found' 
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'employee' && serviceLog.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    // Update fields
    const updateFields = ['description', 'workType', 'status', 'endTime', 'parts', 'laborCost', 'notes'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        serviceLog[field] = req.body[field];
      }
    });

    await serviceLog.save();

    await serviceLog.populate([
      { path: 'appointment', select: 'vehicle serviceType status' },
      { path: 'employee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time update
    req.io.emit('service-log-updated', {
      serviceLog,
      updatedBy: req.user
    });

    res.json({
      message: 'Service log updated successfully',
      serviceLog
    });

  } catch (error) {
    console.error('Update service log error:', error);
    
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

// Complete service log (end work session)
router.patch('/:id/complete', authorize('employee', 'admin'), async (req, res) => {
  try {
    const serviceLog = await ServiceLog.findById(req.params.id);
    
    if (!serviceLog) {
      return res.status(404).json({ 
        message: 'Service log not found' 
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'employee' && serviceLog.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    if (serviceLog.status === 'completed') {
      return res.status(400).json({ 
        message: 'Service log is already completed' 
      });
    }

    serviceLog.endTime = new Date();
    serviceLog.status = 'completed';

    await serviceLog.save();

    await serviceLog.populate([
      { path: 'appointment', select: 'vehicle serviceType status' },
      { path: 'employee', select: 'firstName lastName employeeId department' }
    ]);

    // Emit real-time update
    req.io.emit('service-log-completed', {
      serviceLog,
      completedBy: req.user
    });

    res.json({
      message: 'Service log completed successfully',
      serviceLog
    });

  } catch (error) {
    console.error('Complete service log error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get employee work summary
router.get('/summary/employee/:employeeId?', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user._id;
    
    // Check authorization
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.startTime = {};
      if (startDate) dateFilter.startTime.$gte = new Date(startDate);
      if (endDate) dateFilter.startTime.$lte = new Date(endDate);
    }

    const serviceLogs = await ServiceLog.find({
      employee: employeeId,
      ...dateFilter
    }).populate('appointment', 'vehicle serviceType');

    // Calculate summary
    const summary = {
      totalHours: serviceLogs.reduce((total, log) => total + log.hoursLogged, 0),
      totalLogs: serviceLogs.length,
      completedLogs: serviceLogs.filter(log => log.status === 'completed').length,
      totalLaborCost: serviceLogs.reduce((total, log) => total + log.laborCost, 0),
      workTypeBreakdown: {}
    };

    // Work type breakdown
    serviceLogs.forEach(log => {
      if (!summary.workTypeBreakdown[log.workType]) {
        summary.workTypeBreakdown[log.workType] = {
          count: 0,
          hours: 0
        };
      }
      summary.workTypeBreakdown[log.workType].count++;
      summary.workTypeBreakdown[log.workType].hours += log.hoursLogged;
    });

    res.json({
      summary,
      serviceLogs
    });

  } catch (error) {
    console.error('Get employee summary error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export default router;
