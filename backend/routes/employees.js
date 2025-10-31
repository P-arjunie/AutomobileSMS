import express from 'express';
import User from '../models/User.js';
import ServiceLog from '../models/ServiceLog.js';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all employees (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { department, isActive } = req.query;
    
    let query = { role: { $in: ['employee', 'admin'] } };
    
    if (department) {
      query.department = department;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const employees = await User.find(query)
      .select('-password')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      employees,
      count: employees.length
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get single employee
router.get('/:id', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }

    // Employees can only view their own profile (unless admin)
    if (req.user.role === 'employee' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    res.json({ employee });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update employee profile
router.put('/:id', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }

    // Employees can only update their own profile (unless admin)
    if (req.user.role === 'employee' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    // Fields that can be updated
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedFields.push('department', 'isActive', 'employeeId');
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    await employee.save();

    res.json({
      message: 'Employee profile updated successfully',
      employee
    });

  } catch (error) {
    console.error('Update employee error:', error);
    
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

// Get employee workload
router.get('/:id/workload', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Employees can only view their own workload (unless admin)
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    const employee = await User.findById(employeeId);
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }

    // Get current appointments
    const currentAppointments = await Appointment.find({
      assignedEmployee: employeeId,
      status: { $in: ['confirmed', 'in-progress', 'waiting-parts'] }
    }).populate('customer', 'firstName lastName');

    // Get active service logs
    const activeServiceLogs = await ServiceLog.find({
      employee: employeeId,
      status: 'in-progress'
    }).populate('appointment', 'vehicle serviceType');

    // Get recent completed work (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWork = await ServiceLog.find({
      employee: employeeId,
      status: 'completed',
      endTime: { $gte: thirtyDaysAgo }
    }).populate('appointment', 'vehicle serviceType');

    // Calculate statistics
    const stats = {
      pendingAppointments: currentAppointments.length,
      activeServiceLogs: activeServiceLogs.length,
      recentCompletedHours: recentWork.reduce((total, log) => total + log.hoursLogged, 0),
      recentCompletedJobs: recentWork.length
    };

    res.json({
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        department: employee.department
      },
      currentAppointments,
      activeServiceLogs,
      recentWork,
      stats
    });

  } catch (error) {
    console.error('Get employee workload error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get employee time tracking summary
router.get('/:id/time-summary', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Employees can only view their own summary (unless admin)
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    const { startDate, endDate, period = 'month' } = req.query;
    
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        startTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      dateFilter = {
        startTime: {
          $gte: startOfPeriod,
          $lte: endOfPeriod
        }
      };
    }

    const serviceLogs = await ServiceLog.find({
      employee: employeeId,
      ...dateFilter
    }).populate('appointment', 'vehicle serviceType customer')
      .populate('appointment.customer', 'firstName lastName');

    // Group by day
    const dailyHours = {};
    const workTypeHours = {};
    let totalHours = 0;
    let totalLaborCost = 0;

    serviceLogs.forEach(log => {
      const day = log.startTime.toISOString().split('T')[0];
      
      if (!dailyHours[day]) {
        dailyHours[day] = 0;
      }
      
      dailyHours[day] += log.hoursLogged;
      totalHours += log.hoursLogged;
      totalLaborCost += log.laborCost;
      
      if (!workTypeHours[log.workType]) {
        workTypeHours[log.workType] = 0;
      }
      workTypeHours[log.workType] += log.hoursLogged;
    });

    res.json({
      period: {
        startDate: dateFilter.startTime.$gte,
        endDate: dateFilter.startTime.$lte
      },
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalJobs: serviceLogs.length,
        totalLaborCost,
        averageHoursPerDay: Object.keys(dailyHours).length > 0 
          ? Math.round((totalHours / Object.keys(dailyHours).length) * 100) / 100 
          : 0
      },
      dailyHours,
      workTypeHours,
      serviceLogs: serviceLogs.map(log => ({
        id: log._id,
        date: log.startTime.toISOString().split('T')[0],
        hours: log.hoursLogged,
        workType: log.workType,
        description: log.description,
        appointment: {
          id: log.appointment._id,
          vehicle: log.appointment.vehicle,
          serviceType: log.appointment.serviceType,
          customer: log.appointment.customer
        }
      }))
    });

  } catch (error) {
    console.error('Get employee time summary error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Deactivate employee (admin only)
router.patch('/:id/deactivate', authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }

    employee.isActive = false;
    await employee.save();

    res.json({
      message: 'Employee deactivated successfully',
      employee
    });

  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Activate employee (admin only)
router.patch('/:id/activate', authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({ 
        message: 'Employee not found' 
      });
    }

    employee.isActive = true;
    await employee.save();

    res.json({
      message: 'Employee activated successfully',
      employee
    });

  } catch (error) {
    console.error('Activate employee error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export default router;
