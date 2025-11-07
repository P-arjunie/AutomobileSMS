import express from 'express';
import Appointment from '../models/Appointment.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/modification-requests?status=pending&page=1&limit=20
router.get('/', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Find appointments that have modification requests with the given status
    const query = { 'modificationRequests.status': status };

    const appointments = await Appointment.find(query)
      .select('serviceType scheduledDate customer vehicle modificationRequests')
      .populate('customer', 'firstName lastName email')
      .sort({ 'modificationRequests.requestedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Flatten modification requests
    const requests = [];
    appointments.forEach(app => {
      (app.modificationRequests || []).forEach(reqItem => {
        if (reqItem.status === status) {
          requests.push({
            requestId: reqItem._id,
            appointmentId: app._id,
            serviceType: app.serviceType,
            scheduledDate: app.scheduledDate,
            customer: app.customer,
            vehicle: app.vehicle,
            reason: reqItem.reason,
            newScheduledDate: reqItem.newScheduledDate,
            status: reqItem.status,
            requestedAt: reqItem.requestedAt,
            respondedAt: reqItem.respondedAt,
            respondedBy: reqItem.respondedBy
          });
        }
      });
    });

    const total = await Appointment.countDocuments(query);

    res.json({ requests, page: parseInt(page, 10), limit: parseInt(limit, 10), total });
  } catch (error) {
    console.error('Get modification requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve a modification request
router.patch('/:id/approve', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({ 'modificationRequests._id': id });
    if (!appointment) return res.status(404).json({ message: 'Modification request not found' });

    const modReq = appointment.modificationRequests.id(id);
    if (!modReq) return res.status(404).json({ message: 'Modification request not found' });

    if (modReq.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    modReq.status = 'approved';
    modReq.respondedAt = new Date();
    modReq.respondedBy = req.user._id;

    // If request included newScheduledDate, update appointment scheduledDate
    if (modReq.newScheduledDate) {
      appointment.scheduledDate = modReq.newScheduledDate;
    }

    // Add a note to appointment for audit
    appointment.notes.push({
      text: `Modification request approved by ${req.user.firstName} ${req.user.lastName}`,
      author: req.user._id
    });

    await appointment.save();

    // Emit socket events
    req.io.to(`appointment:${appointment._id}`).emit('modification-request-approved', {
      appointmentId: appointment._id,
      requestId: id,
      approvedBy: req.user,
      newScheduledDate: modReq.newScheduledDate
    });

    res.json({ message: 'Modification request approved', appointmentId: appointment._id, requestId: id });
  } catch (error) {
    console.error('Approve modification request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject a modification request
router.patch('/:id/reject', authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason: reviewReason } = req.body;

    const appointment = await Appointment.findOne({ 'modificationRequests._id': id });
    if (!appointment) return res.status(404).json({ message: 'Modification request not found' });

    const modReq = appointment.modificationRequests.id(id);
    if (!modReq) return res.status(404).json({ message: 'Modification request not found' });

    if (modReq.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    modReq.status = 'rejected';
    modReq.respondedAt = new Date();
    modReq.respondedBy = req.user._id;

    // Add a note to appointment for audit and include optional review reason
    appointment.notes.push({
      text: `Modification request rejected by ${req.user.firstName} ${req.user.lastName}${reviewReason ? `: ${reviewReason}` : ''}`,
      author: req.user._id
    });

    await appointment.save();

    // Emit socket events
    req.io.to(`appointment:${appointment._id}`).emit('modification-request-rejected', {
      appointmentId: appointment._id,
      requestId: id,
      rejectedBy: req.user,
      reason: reviewReason
    });

    res.json({ message: 'Modification request rejected', appointmentId: appointment._id, requestId: id });
  } catch (error) {
    console.error('Reject modification request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
