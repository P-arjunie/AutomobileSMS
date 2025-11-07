import express from 'express';
import TimeLog from '../models/TimeLog.js';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/time-logs - Create time log entry
router.post('/', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { serviceProjectId, startTime, endTime, description } = req.body;

    // Validate required fields
    if (!serviceProjectId || !startTime) {
      return res.status(400).json({
        message: 'Service project ID and start time are required'
      });
    }

    // Verify service project exists
    const serviceProject = await Appointment.findById(serviceProjectId);
    if (!serviceProject) {
      return res.status(404).json({
        message: 'Service project not found'
      });
    }

    // Check if employee is assigned to this service (unless admin)
    if (req.user.role === 'employee' && 
        serviceProject.assignedEmployee && 
        serviceProject.assignedEmployee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You are not assigned to this service project'
      });
    }

    const startTimeDate = new Date(startTime);
    const endTimeDate = endTime ? new Date(endTime) : null;

    // Validate time logic
    if (endTimeDate && endTimeDate <= startTimeDate) {
      return res.status(400).json({
        message: 'End time must be after start time'
      });
    }

    // Check for overlapping time logs
    if (endTimeDate) {
      const tempLog = new TimeLog({
        employee: req.user._id,
        serviceProject: serviceProjectId,
        startTime: startTimeDate,
        endTime: endTimeDate
      });

      const hasOverlap = await tempLog.hasOverlap(req.user._id, startTimeDate, endTimeDate);
      if (hasOverlap) {
        return res.status(400).json({
          message: 'This time entry overlaps with an existing time log'
        });
      }
    }

    // Create time log
    const timeLog = new TimeLog({
      employee: req.user._id,
      serviceProject: serviceProjectId,
      startTime: startTimeDate,
      endTime: endTimeDate,
      description,
      status: endTimeDate ? 'completed' : 'active'
    });

    await timeLog.save();

    await timeLog.populate([
      { path: 'serviceProject', select: 'vehicle serviceType status customer' },
      { path: 'serviceProject.customer', select: 'firstName lastName' },
      { path: 'employee', select: 'firstName lastName employeeId' }
    ]);

    res.status(201).json({
      message: 'Time log created successfully',
      timeLog
    });

  } catch (error) {
    console.error('Create time log error:', error);
    
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

// GET /api/time-logs - Get employee's time logs (with filters)
router.get('/', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      serviceProjectId,
      page = 1,
      limit = 50
    } = req.query;

    const employeeId = req.user.role === 'admin' && req.query.employeeId 
      ? req.query.employeeId 
      : req.user._id;

    // Build query
    let query = { employee: employeeId };

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Service project filter
    if (serviceProjectId) {
      query.serviceProject = serviceProjectId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const timeLogs = await TimeLog.find(query)
      .populate('serviceProject', 'vehicle serviceType status scheduledDate')
      .populate('serviceProject.customer', 'firstName lastName')
      .populate('employee', 'firstName lastName employeeId')
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await TimeLog.countDocuments(query);

    res.json({
      timeLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// PUT /api/time-logs/:id - Update time log
router.put('/:id', authorize('employee', 'admin'), async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);

    if (!timeLog) {
      return res.status(404).json({
        message: 'Time log not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'employee' && 
        timeLog.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Update fields
    const { startTime, endTime, description, status } = req.body;

    if (startTime !== undefined) {
      timeLog.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      timeLog.endTime = endTime ? new Date(endTime) : null;
    }

    if (description !== undefined) {
      timeLog.description = description;
    }

    if (status !== undefined) {
      timeLog.status = status;
    }

    // Validate time logic
    if (timeLog.endTime && timeLog.endTime <= timeLog.startTime) {
      return res.status(400).json({
        message: 'End time must be after start time'
      });
    }

    // Check for overlaps if times changed
    if ((startTime !== undefined || endTime !== undefined) && timeLog.endTime) {
      const hasOverlap = await timeLog.hasOverlap(
        timeLog.employee,
        timeLog.startTime,
        timeLog.endTime
      );
      
      if (hasOverlap) {
        return res.status(400).json({
          message: 'This time entry overlaps with an existing time log'
        });
      }
    }

    await timeLog.save();

    await timeLog.populate([
      { path: 'serviceProject', select: 'vehicle serviceType status' },
      { path: 'employee', select: 'firstName lastName employeeId' }
    ]);

    res.json({
      message: 'Time log updated successfully',
      timeLog
    });

  } catch (error) {
    console.error('Update time log error:', error);
    
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

// DELETE /api/time-logs/:id - Delete time log
router.delete('/:id', authorize('employee', 'admin'), async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);

    if (!timeLog) {
      return res.status(404).json({
        message: 'Time log not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'employee' && 
        timeLog.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    await timeLog.deleteOne();

    res.json({
      message: 'Time log deleted successfully'
    });

  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// POST /api/time-logs/start - Start timer for service
router.post('/start', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { serviceProjectId, description } = req.body;

    if (!serviceProjectId) {
      return res.status(400).json({
        message: 'Service project ID is required'
      });
    }

    // Verify service project exists
    const serviceProject = await Appointment.findById(serviceProjectId);
    if (!serviceProject) {
      return res.status(404).json({
        message: 'Service project not found'
      });
    }

    // Check if employee is assigned (unless admin)
    if (req.user.role === 'employee' && 
        serviceProject.assignedEmployee && 
        serviceProject.assignedEmployee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You are not assigned to this service project'
      });
    }

    // Check if there's already an active timer for this employee
    const activeTimer = await TimeLog.findOne({
      employee: req.user._id,
      status: 'active'
    });

    if (activeTimer) {
      return res.status(400).json({
        message: 'You already have an active timer. Please stop it first.',
        activeTimer
      });
    }

    // Create active time log
    const timeLog = new TimeLog({
      employee: req.user._id,
      serviceProject: serviceProjectId,
      startTime: new Date(),
      endTime: null,
      description,
      status: 'active'
    });

    await timeLog.save();

    await timeLog.populate([
      { path: 'serviceProject', select: 'vehicle serviceType status scheduledDate' },
      { path: 'serviceProject.customer', select: 'firstName lastName' },
      { path: 'employee', select: 'firstName lastName employeeId' }
    ]);

    res.status(201).json({
      message: 'Timer started successfully',
      timeLog
    });

  } catch (error) {
    console.error('Start timer error:', error);
    
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

// POST /api/time-logs/stop - Stop active timer
router.post('/stop', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { description } = req.body;

    // Find active timer for this employee
    const activeTimer = await TimeLog.findOne({
      employee: req.user._id,
      status: 'active'
    });

    if (!activeTimer) {
      return res.status(404).json({
        message: 'No active timer found'
      });
    }

    // Update timer
    activeTimer.endTime = new Date();
    activeTimer.status = 'completed';
    
    if (description) {
      activeTimer.description = description;
    }

    await activeTimer.save();

    await activeTimer.populate([
      { path: 'serviceProject', select: 'vehicle serviceType status' },
      { path: 'serviceProject.customer', select: 'firstName lastName' },
      { path: 'employee', select: 'firstName lastName employeeId' }
    ]);

    res.json({
      message: 'Timer stopped successfully',
      timeLog: activeTimer
    });

  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/time-logs/summary - Get time summary (daily/weekly/monthly)
router.get('/summary', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { 
      period = 'month', // daily, weekly, monthly
      startDate,
      endDate,
      employeeId
    } = req.query;

    const targetEmployeeId = (req.user.role === 'admin' && employeeId) 
      ? employeeId 
      : req.user._id;

    // Calculate date range
    let dateStart, dateEnd;
    const now = new Date();

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          dateStart = new Date(now.setHours(0, 0, 0, 0));
          dateEnd = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          dateStart = new Date(now);
          dateStart.setDate(now.getDate() - dayOfWeek);
          dateStart.setHours(0, 0, 0, 0);
          dateEnd = new Date(dateStart);
          dateEnd.setDate(dateStart.getDate() + 6);
          dateEnd.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
        default:
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
      }
    }

    // Get time logs in range
    const timeLogs = await TimeLog.find({
      employee: targetEmployeeId,
      startTime: {
        $gte: dateStart,
        $lte: dateEnd
      },
      status: { $ne: 'cancelled' }
    })
      .populate('serviceProject', 'vehicle serviceType')
      .sort({ startTime: 1 });

    // Calculate aggregations
    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(2);
    const totalLogs = timeLogs.length;
    const completedLogs = timeLogs.filter(log => log.status === 'completed').length;

    // Group by date
    const dailyBreakdown = {};
    timeLogs.forEach(log => {
      const dateKey = log.startTime.toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          hours: 0,
          minutes: 0,
          logs: []
        };
      }
      dailyBreakdown[dateKey].hours += log.durationMinutes / 60;
      dailyBreakdown[dateKey].minutes += log.durationMinutes;
      dailyBreakdown[dateKey].logs.push(log);
    });

    // Group by service project
    const serviceProjectBreakdown = {};
    timeLogs.forEach(log => {
      const projectId = log.serviceProject._id.toString();
      if (!serviceProjectBreakdown[projectId]) {
        serviceProjectBreakdown[projectId] = {
          project: log.serviceProject,
          hours: 0,
          minutes: 0,
          logs: []
        };
      }
      serviceProjectBreakdown[projectId].hours += log.durationMinutes / 60;
      serviceProjectBreakdown[projectId].minutes += log.durationMinutes;
      serviceProjectBreakdown[projectId].logs.push(log);
    });

    res.json({
      period,
      dateRange: {
        start: dateStart,
        end: dateEnd
      },
      summary: {
        totalHours: parseFloat(totalHours),
        totalMinutes,
        totalLogs,
        completedLogs,
        averageHoursPerDay: Object.keys(dailyBreakdown).length > 0
          ? (totalMinutes / 60 / Object.keys(dailyBreakdown).length).toFixed(2)
          : 0
      },
      dailyBreakdown: Object.values(dailyBreakdown).map(day => ({
        ...day,
        hours: parseFloat((day.minutes / 60).toFixed(2)),
        logCount: day.logs.length
      })),
      serviceProjectBreakdown: Object.values(serviceProjectBreakdown).map(project => ({
        ...project,
        hours: parseFloat((project.minutes / 60).toFixed(2)),
        logCount: project.logs.length
      }))
    });

  } catch (error) {
    console.error('Get time summary error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

export default router;

