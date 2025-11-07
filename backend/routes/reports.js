import express from 'express';
import Appointment from '../models/Appointment.js';
import ServiceLog from '../models/ServiceLog.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// All report routes require authentication and admin role
router.use(authenticateToken);
router.use(authorize('admin'));

// POST /api/reports/generate - Generate custom reports
router.post('/generate', async (req, res) => {
  try {
    const {
      name,
      type,
      dateRange,
      filters,
      format = 'json',
      description
    } = req.body;

    if (!name || !type || !dateRange || !dateRange.startDate || !dateRange.endDate) {
      return res.status(400).json({
        message: 'Missing required fields: name, type, dateRange (startDate, endDate)'
      });
    }

    let reportData = {};

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    switch (type) {
      case 'service-completion':
        {
          let matchQuery = {
            startTime: { $gte: startDate, $lte: endDate }
          };

          if (filters?.status) {
            matchQuery.status = filters.status;
          }
          if (filters?.employeeId) {
            matchQuery.employee = filters.employeeId;
          }

          const serviceData = await ServiceLog.aggregate([
            { $match: matchQuery },
            {
              $lookup: {
                from: 'appointments',
                localField: 'appointment',
                foreignField: '_id',
                as: 'appointmentDetails'
              }
            },
            { $unwind: '$appointmentDetails' },
            {
              $group: {
                _id: null,
                totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                totalInProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
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
                },
                avgDuration: { $avg: '$hoursLogged' }
              }
            }
          ]);

          const dailyBreakdown = await ServiceLog.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                count: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                totalHours: { $sum: '$hoursLogged' }
              }
            },
            { $sort: { _id: 1 } }
          ]);

          reportData = {
            summary: serviceData[0] || {},
            dailyBreakdown
          };
        }
        break;

      case 'employee-productivity':
        {
          let matchQuery = {
            startTime: { $gte: startDate, $lte: endDate }
          };

          if (filters?.department) {
            // Need to lookup employees first
            const employees = await User.find({ 
              role: { $in: ['employee', 'admin'] },
              department: filters.department,
              isActive: true
            }).select('_id');
            matchQuery.employee = { $in: employees.map(e => e._id) };
          }

          const productivityData = await ServiceLog.aggregate([
            { $match: matchQuery },
            {
              $lookup: {
                from: 'users',
                localField: 'employee',
                foreignField: '_id',
                as: 'employeeInfo'
              }
            },
            { $unwind: '$employeeInfo' },
            {
              $group: {
                _id: '$employee',
                employeeName: { $first: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] } },
                employeeId: { $first: '$employeeInfo.employeeId' },
                department: { $first: '$employeeInfo.department' },
                totalJobs: { $sum: 1 },
                completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                totalHours: { $sum: '$hoursLogged' },
                avgHoursPerJob: { $avg: '$hoursLogged' },
                completionRate: {
                  $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 100, 0] }
                }
              }
            },
            { $sort: { totalJobs: -1 } }
          ]);

          reportData = {
            employees: productivityData
          };
        }
        break;

      case 'customer-history':
        {
          let matchQuery = {
            scheduledDate: { $gte: startDate, $lte: endDate }
          };

          if (filters?.status) {
            matchQuery.status = filters.status;
          }

          const customerData = await Appointment.aggregate([
            { $match: matchQuery },
            {
              $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerInfo'
              }
            },
            { $unwind: '$customerInfo' },
            {
              $group: {
                _id: '$customer',
                customerName: { $first: { $concat: ['$customerInfo.firstName', ' ', '$customerInfo.lastName'] } },
                email: { $first: '$customerInfo.email' },
                phone: { $first: '$customerInfo.phone' },
                totalAppointments: { $sum: 1 },
                completedAppointments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                totalSpent: { $sum: '$actualCost' },
                avgCost: { $avg: '$actualCost' }
              }
            },
            { $sort: { totalSpent: -1 } }
          ]);

          reportData = {
            customers: customerData
          };
        }
        break;

      case 'revenue':
        {
          let matchQuery = {
            status: 'completed',
            scheduledDate: { $gte: startDate, $lte: endDate }
          };

          if (filters?.serviceType) {
            matchQuery.serviceType = filters.serviceType;
          }

          const revenueData = await Appointment.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$actualCost' },
                totalAppointments: { $sum: 1 },
                avgRevenue: { $avg: '$actualCost' },
                minRevenue: { $min: '$actualCost' },
                maxRevenue: { $max: '$actualCost' }
              }
            }
          ]);

          const dailyRevenue = await Appointment.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
                revenue: { $sum: '$actualCost' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]);

          const serviceTypeRevenue = await Appointment.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: '$serviceType',
                revenue: { $sum: '$actualCost' },
                count: { $sum: 1 }
              }
            },
            { $sort: { revenue: -1 } }
          ]);

          reportData = {
            summary: revenueData[0] || {},
            dailyRevenue,
            serviceTypeRevenue
          };
        }
        break;

      case 'appointments':
        {
          let matchQuery = {
            scheduledDate: { $gte: startDate, $lte: endDate }
          };

          if (filters?.status) {
            if (Array.isArray(filters.status)) {
              matchQuery.status = { $in: filters.status };
            } else {
              matchQuery.status = filters.status;
            }
          }
          if (filters?.serviceType) {
            matchQuery.serviceType = filters.serviceType;
          }

          const appointmentData = await Appointment.find(matchQuery)
            .populate('customer', 'firstName lastName email')
            .populate('assignedEmployee', 'firstName lastName employeeId')
            .sort({ scheduledDate: 1 });

          const summary = await Appointment.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ]);

          reportData = {
            appointments: appointmentData,
            summary
          };
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Save report if requested
    const savedReport = await Report.create({
      name,
      type,
      createdBy: req.user._id,
      parameters: filters || {},
      dateRange: {
        startDate,
        endDate
      },
      data: reportData,
      format,
      filters: filters || {},
      description
    });

    res.json({
      report: savedReport,
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/reports/export - Export reports in various formats
router.get('/export', async (req, res) => {
  try {
    const {
      reportId,
      type: queryType,
      format: queryFormat = 'csv',
      dateRange,
      filters
    } = req.query;

    let reportData = null;
    let reportType = queryType;
    let exportFormat = queryFormat;

    // If reportId is provided, fetch saved report
    if (reportId) {
      const savedReport = await Report.findById(reportId);
      if (!savedReport || savedReport.createdBy.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Report not found' });
      }
      reportData = savedReport.data;
      reportType = savedReport.type;
      exportFormat = savedReport.format || exportFormat;
    } else if (reportType) {
      // Generate report on the fly
      const startDate = new Date(dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(dateRange?.endDate || new Date());

      // Similar logic to generate endpoint, but simplified for export
      let matchQuery = {};

      if (reportType === 'appointments' || reportType === 'revenue' || reportType === 'customer-history') {
        matchQuery = { scheduledDate: { $gte: startDate, $lte: endDate } };
        if (filters?.status) matchQuery.status = filters.status;
        if (filters?.serviceType) matchQuery.serviceType = filters.serviceType;

        const appointments = await Appointment.find(matchQuery)
          .populate('customer', 'firstName lastName email phone')
          .populate('assignedEmployee', 'firstName lastName employeeId')
          .sort({ scheduledDate: 1 });

        reportData = { appointments };
      } else if (reportType === 'service-completion' || reportType === 'employee-productivity') {
        matchQuery = { startTime: { $gte: startDate, $lte: endDate } };
        if (filters?.status) matchQuery.status = filters.status;
        if (filters?.employeeId) matchQuery.employee = filters.employeeId;

        const serviceLogs = await ServiceLog.find(matchQuery)
          .populate('employee', 'firstName lastName employeeId department')
          .populate('appointment', 'vehicle serviceType customer')
          .populate('appointment.customer', 'firstName lastName')
          .sort({ startTime: 1 });

        reportData = { serviceLogs };
      }
    } else {
      return res.status(400).json({ message: 'reportId or type is required' });
    }

    // Convert to requested format
    if (exportFormat === 'csv') {
      let csv = '';
      
      if (reportData.appointments) {
        // CSV for appointments
        csv = 'Date,Customer,Vehicle,Service Type,Status,Assigned Employee,Cost\n';
        reportData.appointments.forEach(apt => {
          const date = new Date(apt.scheduledDate).toLocaleDateString();
          const customer = `${apt.customer?.firstName || ''} ${apt.customer?.lastName || ''}`.trim();
          const vehicle = `${apt.vehicle.year} ${apt.vehicle.make} ${apt.vehicle.model}`;
          const employee = `${apt.assignedEmployee?.firstName || ''} ${apt.assignedEmployee?.lastName || ''}`.trim();
          csv += `${date},"${customer}","${vehicle}","${apt.serviceType}","${apt.status}","${employee}",${apt.actualCost || 0}\n`;
        });
      } else if (reportData.serviceLogs) {
        // CSV for service logs
        csv = 'Start Time,Employee,Service Type,Status,Hours Logged,Labor Cost,Parts Cost\n';
        reportData.serviceLogs.forEach(log => {
          const startTime = new Date(log.startTime).toLocaleString();
          const employee = `${log.employee?.firstName || ''} ${log.employee?.lastName || ''}`.trim();
          const serviceType = log.appointment?.serviceType || '';
          const partsCost = log.parts.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
          csv += `${startTime},"${employee}","${serviceType}","${log.status}",${log.hoursLogged},${log.laborCost},${partsCost}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
      return res.send(csv);
    } else if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.json`);
      return res.json(reportData);
    } else if (exportFormat === 'pdf') {
      // Generate a simple PDF using pdfkit
      const doc = new PDFDocument({ autoFirstPage: true, margin: 40 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.pdf`);

      // Pipe PDF stream to response
      doc.pipe(res);

      // Header
      doc.fontSize(18).text('Automobile SMS - Report', { align: 'center' });
      doc.moveDown(0.5);

      // Report meta
      try {
        const start = (dateRange && dateRange.startDate) ? new Date(dateRange.startDate).toLocaleDateString() : '';
        const end = (dateRange && dateRange.endDate) ? new Date(dateRange.endDate).toLocaleDateString() : '';
        doc.fontSize(10).fillColor('gray').text(`Type: ${reportType || ''}`, { align: 'left' });
        doc.text(`Date Range: ${start} - ${end}`, { align: 'left' });
        doc.moveDown(0.5);

        // Render content depending on report data
        if (reportData.appointments) {
          doc.fontSize(12).fillColor('black').text('Appointments', { underline: true });
          doc.moveDown(0.25);

          // table header
          doc.fontSize(9).text('Date', { continued: true, width: 90 });
          doc.text('Customer', { continued: true, width: 140 });
          doc.text('Vehicle', { continued: true, width: 120 });
          doc.text('Service', { continued: true, width: 80 });
          doc.text('Status', { continued: true, width: 80 });
          doc.text('Cost', { width: 60 });
          doc.moveDown(0.2);

          reportData.appointments.forEach(apt => {
            const date = apt.scheduledDate ? new Date(apt.scheduledDate).toLocaleDateString() : '';
            const customer = `${apt.customer?.firstName || ''} ${apt.customer?.lastName || ''}`.trim();
            const vehicle = apt.vehicle ? `${apt.vehicle.year || ''} ${apt.vehicle.make || ''} ${apt.vehicle.model || ''}` : '';
            const serviceType = apt.serviceType || '';
            const status = apt.status || '';
            const cost = apt.actualCost != null ? apt.actualCost : '';

            doc.fontSize(9).text(date, { continued: true, width: 90 });
            doc.text(customer, { continued: true, width: 140 });
            doc.text(vehicle, { continued: true, width: 120 });
            doc.text(serviceType, { continued: true, width: 80 });
            doc.text(status, { continued: true, width: 80 });
            doc.text(cost.toString(), { width: 60 });
          });
        } else if (reportData.serviceLogs) {
          doc.fontSize(12).fillColor('black').text('Service Logs', { underline: true });
          doc.moveDown(0.25);

          // table header
          doc.fontSize(9).text('Start Time', { continued: true, width: 120 });
          doc.text('Employee', { continued: true, width: 140 });
          doc.text('Service Type', { continued: true, width: 100 });
          doc.text('Status', { continued: true, width: 80 });
          doc.text('Hours', { width: 60 });
          doc.moveDown(0.2);

          reportData.serviceLogs.forEach(log => {
            const startTime = log.startTime ? new Date(log.startTime).toLocaleString() : '';
            const employee = `${log.employee?.firstName || ''} ${log.employee?.lastName || ''}`.trim();
            const serviceType = log.appointment?.serviceType || '';
            const status = log.status || '';
            const hours = log.hoursLogged != null ? log.hoursLogged : '';

            doc.fontSize(9).text(startTime, { continued: true, width: 120 });
            doc.text(employee, { continued: true, width: 140 });
            doc.text(serviceType, { continued: true, width: 100 });
            doc.text(status, { continued: true, width: 80 });
            doc.text(hours.toString(), { width: 60 });
          });
        } else {
          doc.fontSize(12).fillColor('black').text('No exportable data available for this report.', { align: 'left' });
        }
      } catch (err) {
        console.error('PDF generation error meta:', err);
      }

      doc.end();
      // return after piping
      return;
    } else {
      return res.status(400).json({ 
        message: 'Invalid export format. Supported: csv, json, pdf' 
      });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/reports - Get all saved reports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ createdBy: req.user._id });

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// GET /api/reports/:id - Get a specific report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!report || report.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report || report.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

export default router;

