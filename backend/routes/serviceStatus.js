// const express = require('express');
import express from 'express';
const router = express.Router();
import ServiceProject from '../models/ServiceProject.js';
import ServiceStatusHistory from '../models/ServiceStatusHistory.js';
import { authorize } from '../middleware/auth.js';

// GET /api/services/:id/status - Get current service status
router.get('/:id/status', authorize('customer','employee', 'admin'), async (req, res) => {
  try {
    const service = await ServiceProject.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service project not found' });
    }
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PATCH /api/services/:id/status - Update service status (employee)
router.patch('/:id/status', authorize('customer','employee', 'admin'), async (req, res) => {
  // Add employee role check here later
  try {
    const { status, notes } = req.body;
    let service = await ServiceProject.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service project not found' });
    }

    service.current_status = status;
    await service.save();

    const statusHistory = new ServiceStatusHistory({
      service_project_id: req.params.id,
      status,
      notes,
      updated_by: req.user.id,
    });
    await statusHistory.save();

    req.io.emitToService(req.params.id, 'service.status.updated', { service, statusHistory });

    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/services/:id/updates - Add status update/note
router.post('/:id/updates', authorize('customer','employee', 'admin'), async (req, res) => {
    // Add employee role check here later
  try {
    const { notes } = req.body;
    const service = await ServiceProject.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service project not found' });
    }

    const statusHistory = new ServiceStatusHistory({
      service_project_id: req.params.id,
      status: service.current_status,
      notes,
      updated_by: req.user.id,
    });
    await statusHistory.save();

    req.io.emitToService(req.params.id, 'service.note.added', statusHistory);

    res.json(statusHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/services/:id/timeline - Get complete service timeline
router.get('/:id/timeline', authorize('customer','employee', 'admin'), async (req, res) => {
  try {
    const timeline = await ServiceStatusHistory.find({ service_project_id: req.params.id }).sort({ timestamp: -1 });
    res.json(timeline);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/services/active - Get all active services (employee)
router.get('/active', authorize('customer','employee', 'admin'), async (req, res) => {
    // Add employee role check here later
  try {
    const activeServices = await ServiceProject.find({ current_status: { $ne: 'Completed' } });
    res.json(activeServices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


export default router;
