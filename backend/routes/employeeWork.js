import express from 'express';
import Appointment from '../models/Appointment.js';
import TimeLog from '../models/TimeLog.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/employees/assigned-services - Get assigned service projects
router.get('/assigned-services', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { 
      status, 
      dateFrom, 
      dateTo,
      page = 1,
      limit = 50
    } = req.query;

    const employeeId = req.user.role === 'admin' && req.query.employeeId 
      ? req.query.employeeId 
      : req.user._id;

    // Build query
    let query = { assignedEmployee: employeeId };

    // Status filter
    if (status) {
      query.status = status;
    } else {
      // Default: exclude cancelled
      query.status = { $ne: 'cancelled' };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) {
        query.scheduledDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.scheduledDate.$lte = new Date(dateTo);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get assigned services
    const services = await Appointment.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedEmployee', 'firstName lastName employeeId department')
      .sort({ scheduledDate: 1, priority: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Appointment.countDocuments(query);

    // Get time log statistics for each service
    const servicesWithStats = await Promise.all(
      services.map(async (service) => {
        const timeLogs = await TimeLog.find({
          serviceProject: service._id,
          employee: employeeId,
          status: { $ne: 'cancelled' }
        });

        const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
        const totalHours = totalMinutes > 0 ? (totalMinutes / 60).toFixed(2) : '0.00';
        const activeTimer = timeLogs.find(log => log.status === 'active');

        return {
          ...service.toObject(),
          timeStats: {
            totalHours: parseFloat(totalHours),
            totalMinutes,
            logCount: timeLogs.length,
            hasActiveTimer: !!activeTimer,
            activeTimerId: activeTimer?._id
          }
        };
      })
    );

    res.json({
      services: servicesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get assigned services error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/employees/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', authorize('employee', 'admin'), async (req, res) => {
  try {
    const employeeId = req.user.role === 'admin' && req.query.employeeId 
      ? req.query.employeeId 
      : req.user._id;

    const { dateFrom, dateTo } = req.query;

    // Calculate date range (default: today)
    let dateStart, dateEnd;
    const now = new Date();

    if (dateFrom && dateTo) {
      dateStart = new Date(dateFrom);
      dateEnd = new Date(dateTo);
    } else {
      // Create new date objects to avoid mutating 'now'
      dateStart = new Date(now);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Get assigned services
    const assignedServices = await Appointment.find({
      assignedEmployee: employeeId,
      status: { $ne: 'cancelled' }
    });

    // Get active services
    const activeServices = assignedServices.filter(
      service => ['confirmed', 'in-progress', 'waiting-parts'].includes(service.status)
    );

    // Get completed services
    const completedServices = assignedServices.filter(
      service => service.status === 'completed'
    );

    // Get time logs for today
    const todayTimeLogs = await TimeLog.find({
      employee: employeeId,
      startTime: {
        $gte: dateStart,
        $lte: dateEnd
      },
      status: { $ne: 'cancelled' }
    });

    const totalMinutesToday = todayTimeLogs.reduce(
      (sum, log) => sum + (log.durationMinutes || 0), 
      0
    );
    const totalHoursToday = totalMinutesToday > 0 ? (totalMinutesToday / 60).toFixed(2) : '0.00';

    // Get active timer
    const activeTimer = await TimeLog.findOne({
      employee: employeeId,
      status: 'active'
    }).populate('serviceProject', 'vehicle serviceType');

    // Get weekly hours (last 7 days)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyTimeLogs = await TimeLog.find({
      employee: employeeId,
      startTime: { $gte: weekStart },
      status: { $ne: 'cancelled' }
    });

    const weeklyMinutes = weeklyTimeLogs.reduce(
      (sum, log) => sum + (log.durationMinutes || 0), 
      0
    );
    const weeklyHours = weeklyMinutes > 0 ? (weeklyMinutes / 60).toFixed(2) : '0.00';

    // Get monthly hours (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTimeLogs = await TimeLog.find({
      employee: employeeId,
      startTime: { $gte: monthStart },
      status: { $ne: 'cancelled' }
    });

    const monthlyMinutes = monthlyTimeLogs.reduce(
      (sum, log) => sum + (log.durationMinutes || 0), 
      0
    );
    const monthlyHours = monthlyMinutes > 0 ? (monthlyMinutes / 60).toFixed(2) : '0.00';

    res.json({
      stats: {
        totalHoursToday: parseFloat(totalHoursToday) || 0,
        activeProjects: activeServices.length || 0,
        completedProjects: completedServices.length || 0,
        totalAssignedProjects: assignedServices.length || 0,
        weeklyHours: parseFloat(weeklyHours) || 0,
        monthlyHours: parseFloat(monthlyHours) || 0,
        hasActiveTimer: !!activeTimer,
        activeTimer: activeTimer ? {
          id: activeTimer._id,
          startTime: activeTimer.startTime,
          serviceProject: activeTimer.serviceProject || null,
          durationMinutes: Math.round((new Date() - new Date(activeTimer.startTime)) / (1000 * 60))
        } : null
      },
      dateRange: {
        start: dateStart,
        end: dateEnd
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PATCH /api/services/:id/assign - Assign service to employee
router.patch('/assign/:serviceId', authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: 'Employee ID is required'
      });
    }

    // Verify service exists
    const service = await Appointment.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({
        message: 'Service project not found'
      });
    }

    // Verify employee exists and is active
    const employee = await User.findById(employeeId);
    
    if (!employee || !['employee', 'admin'].includes(employee.role)) {
      return res.status(404).json({
        message: 'Employee not found or invalid role'
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        message: 'Cannot assign service to inactive employee'
      });
    }

    // Update assignment
    service.assignedEmployee = employeeId;
    
    // If service is pending, set to confirmed
    if (service.status === 'pending') {
      service.status = 'confirmed';
    }

    await service.save();

    await service.populate([
      { path: 'customer', select: 'firstName lastName' },
      { path: 'assignedEmployee', select: 'firstName lastName employeeId department' }
    ]);

    res.json({
      message: 'Service assigned successfully',
      service
    });

  } catch (error) {
    console.error('Assign service error:', error);
    
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

export default router;

