import express from 'express';
import Appointment from '../models/Appointment.js';
import ServiceLog from '../models/ServiceLog.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorize('admin'));

// GET /api/admin/dashboard-stats - Overall system statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    // Total appointments
    const totalAppointments = await Appointment.countDocuments();

    // Active services (in-progress service logs)
    const activeServices = await ServiceLog.countDocuments({ status: 'in-progress' });

    // Completed today
    const completedToday = await Appointment.countDocuments({
      status: 'completed',
      endTime: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });

    // Total revenue (from completed appointments)
    const completedAppointments = await Appointment.find({
      status: 'completed',
      actualCost: { $gt: 0 }
    });
    const revenue = completedAppointments.reduce((total, apt) => total + apt.actualCost, 0);

    // Appointments over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const appointmentsOverTime = await Appointment.aggregate([
      {
        $match: {
          scheduledDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Service types distribution
    const serviceTypesDistribution = await Appointment.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Status distribution
    const statusDistribution = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent appointments (last 10)
    const recentAppointments = await Appointment.find()
      .populate('customer', 'firstName lastName email')
      .populate('assignedEmployee', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalAppointments,
        activeServices,
        completedToday,
        revenue: Math.round(revenue * 100) / 100
      },
      charts: {
        appointmentsOverTime: appointmentsOverTime.map(item => ({
          date: item._id,
          count: item.count
        })),
        serviceTypesDistribution: serviceTypesDistribution.map(item => ({
          serviceType: item._id,
          count: item.count
        })),
        statusDistribution: statusDistribution.map(item => ({
          status: item._id,
          count: item.count
        }))
      },
      recentAppointments: recentAppointments.map(apt => ({
        id: apt._id,
        customer: apt.customer,
        vehicle: apt.vehicle,
        serviceType: apt.serviceType,
        status: apt.status,
        scheduledDate: apt.scheduledDate,
        assignedEmployee: apt.assignedEmployee
      }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/appointments - All appointments with advanced filters
router.get('/appointments', async (req, res) => {
  try {
    const {
      status,
      customerId,
      employeeId,
      serviceType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Customer filter
    if (customerId) {
      query.customer = customerId;
    }

    // Employee filter
    if (employeeId) {
      query.assignedEmployee = employeeId;
    }

    // Service type filter
    if (serviceType) {
      if (Array.isArray(serviceType)) {
        query.serviceType = { $in: serviceType };
      } else {
        query.serviceType = serviceType;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) {
        query.scheduledDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.scheduledDate.$lte = new Date(endDate);
      }
    }

    // Search by customer name or vehicle
    if (search) {
      const customers = await User.find({
        role: 'customer',
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      
      query.$or = [
        { customer: { $in: customerIds } },
        { 'vehicle.licensePlate': { $regex: search, $options: 'i' } },
        { 'vehicle.make': { $regex: search, $options: 'i' } },
        { 'vehicle.model': { $regex: search, $options: 'i' } },
        { 'vehicle.vin': { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedEmployee', 'firstName lastName employeeId department')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/services - All service projects
router.get('/services', async (req, res) => {
  try {
    const {
      status,
      employeeId,
      appointmentId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Employee filter
    if (employeeId) {
      query.employee = employeeId;
    }

    // Appointment filter
    if (appointmentId) {
      query.appointment = appointmentId;
    }

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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const serviceLogs = await ServiceLog.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('appointment', 'vehicle serviceType status customer')
      .populate('appointment.customer', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceLog.countDocuments(query);

    // Status overview
    const statusOverview = await ServiceLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Employee workload distribution
    const employeeWorkload = await ServiceLog.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$employee',
          totalHours: { $sum: '$hoursLogged' },
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      {
        $unwind: '$employeeInfo'
      },
      {
        $project: {
          employeeId: '$employeeInfo.employeeId',
          firstName: '$employeeInfo.firstName',
          lastName: '$employeeInfo.lastName',
          department: '$employeeInfo.department',
          totalHours: 1,
          totalJobs: 1,
          completedJobs: 1
        }
      },
      {
        $sort: { totalJobs: -1 }
      }
    ]);

    // Service completion metrics
    const completionMetrics = await ServiceLog.aggregate([
      {
        $match: {
          ...query,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          totalHours: { $sum: '$hoursLogged' },
          totalLaborCost: { $sum: '$laborCost' },
          totalPartsCost: {
            $sum: {
              $reduce: {
                input: '$parts',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.cost'] }] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      serviceLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      overview: {
        statusOverview: statusOverview.map(item => ({
          status: item._id,
          count: item.count
        })),
        employeeWorkload,
        completionMetrics: completionMetrics[0] || {
          totalCompleted: 0,
          avgDuration: 0,
          totalHours: 0,
          totalLaborCost: 0,
          totalPartsCost: 0
        }
      }
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/employees/performance - Employee metrics
router.get('/employees/performance', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department
    } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.startTime = {};
      if (startDate) dateFilter.startTime.$gte = new Date(startDate);
      if (endDate) dateFilter.startTime.$lte = new Date(endDate);
    }

    let employeeQuery = { role: { $in: ['employee', 'admin'] }, isActive: true };
    if (department) {
      employeeQuery.department = department;
    }

    const employees = await User.find(employeeQuery)
      .select('firstName lastName employeeId department');

    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        const serviceLogs = await ServiceLog.find({
          employee: employee._id,
          ...dateFilter
        }).populate('appointment', 'customer vehicle');

        const stats = {
          employeeId: employee.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          totalJobs: serviceLogs.length,
          completedJobs: serviceLogs.filter(log => log.status === 'completed').length,
          totalHours: serviceLogs.reduce((sum, log) => sum + log.hoursLogged, 0),
          totalLaborCost: serviceLogs.reduce((sum, log) => sum + log.laborCost, 0),
          averageHoursPerJob: serviceLogs.length > 0
            ? serviceLogs.reduce((sum, log) => sum + log.hoursLogged, 0) / serviceLogs.length
            : 0,
          completionRate: serviceLogs.length > 0
            ? (serviceLogs.filter(log => log.status === 'completed').length / serviceLogs.length) * 100
            : 0
        };

        return stats;
      })
    );

    res.json({
      performance: performanceData.sort((a, b) => b.totalJobs - a.totalJobs)
    });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/customers - Customer list with service history
router.get('/customers', async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { role: 'customer' };

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get service history for each customer
    const customersWithHistory = await Promise.all(
      customers.map(async (customer) => {
        const appointments = await Appointment.find({ customer: customer._id });
        const completedAppointments = appointments.filter(apt => apt.status === 'completed');
        
        const totalSpent = completedAppointments.reduce(
          (sum, apt) => sum + (apt.actualCost || 0),
          0
        );

        return {
          ...customer.toObject(),
          serviceHistory: {
            totalAppointments: appointments.length,
            completedAppointments: completedAppointments.length,
            totalSpent: Math.round(totalSpent * 100) / 100,
            lastAppointment: appointments.length > 0
              ? appointments.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0].scheduledDate
              : null
          }
        };
      })
    );

    res.json({
      customers: customersWithHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/reports/services - Service reports
router.get('/reports/services', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      employeeId,
      serviceType
    } = req.query;

    let matchQuery = {};

    // Date range filter
    if (startDate || endDate) {
      matchQuery.startTime = {};
      if (startDate) matchQuery.startTime.$gte = new Date(startDate);
      if (endDate) matchQuery.startTime.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      matchQuery.status = status;
    }

    // Employee filter
    if (employeeId) {
      matchQuery.employee = employeeId;
    }

    // Service type filter (through appointment)
    let appointmentMatch = {};
    if (serviceType) {
      appointmentMatch.serviceType = serviceType;
    }

    const serviceReport = await ServiceLog.aggregate([
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentDetails'
        }
      },
      {
        $unwind: '$appointmentDetails'
      },
      {
        $match: appointmentMatch
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            status: '$status'
          },
          count: { $sum: 1 },
          totalHours: { $sum: '$hoursLogged' },
          totalLaborCost: { $sum: '$laborCost' },
          totalPartsCost: {
            $sum: {
              $reduce: {
                input: '$parts',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.cost'] }] }
              }
            }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get service type distribution
    const serviceTypeDistribution = await ServiceLog.aggregate([
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentDetails'
        }
      },
      {
        $unwind: '$appointmentDetails'
      },
      {
        $match: appointmentMatch
      },
      {
        $group: {
          _id: '$appointmentDetails.serviceType',
          count: { $sum: 1 },
          avgDuration: { $avg: '$hoursLogged' }
        }
      }
    ]);

    res.json({
      serviceReport,
      serviceTypeDistribution,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Get service reports error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/reports/appointments - Appointment reports
router.get('/reports/appointments', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      serviceType
    } = req.query;

    let matchQuery = {};

    // Date range filter
    if (startDate || endDate) {
      matchQuery.scheduledDate = {};
      if (startDate) matchQuery.scheduledDate.$gte = new Date(startDate);
      if (endDate) matchQuery.scheduledDate.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        matchQuery.status = { $in: status };
      } else {
        matchQuery.status = status;
      }
    }

    // Service type filter
    if (serviceType) {
      if (Array.isArray(serviceType)) {
        matchQuery.serviceType = { $in: serviceType };
      } else {
        matchQuery.serviceType = serviceType;
      }
    }

    const appointmentReport = await Appointment.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
            status: '$status'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$actualCost' },
          avgCost: { $avg: '$actualCost' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Service type distribution
    const serviceTypeDistribution = await Appointment.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$actualCost' },
          avgCost: { $avg: '$actualCost' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Status distribution
    const statusDistribution = await Appointment.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      appointmentReport,
      serviceTypeDistribution,
      statusDistribution,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Get appointment reports error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

export default router;

