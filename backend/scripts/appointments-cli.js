/*
Usage examples (PowerShell):

# Seed sample data
node scripts/appointments-cli.js seed

# List first 10 appointments
node scripts/appointments-cli.js list

# Update status
node scripts/appointments-cli.js update-status --id=<APPOINTMENT_ID> --status=confirmed

# Cancel appointment
node scripts/appointments-cli.js cancel --id=<APPOINTMENT_ID>

# Delete appointment
node scripts/appointments-cli.js delete --id=<APPOINTMENT_ID>
*/

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

dotenv.config();

const arg = (name, fallback = undefined) => {
  const found = process.argv.find(a => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : fallback;
};

const action = process.argv[2] || 'list';

async function ensureCustomer() {
  const email = 'testcustomer@example.com';
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      firstName: 'Test',
      lastName: 'Customer',
      email,
      password: 'password123',
      phone: '+10000000000',
      role: 'customer'
    });
    await user.save();
    console.log(`Created customer: ${user.email} (${user._id})`);
  } else {
    console.log(`Using existing customer: ${user.email} (${user._id})`);
  }
  return user;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function seed() {
  const customer = await ensureCustomer();
  const now = new Date();

  const samples = [
    {
      customer: customer._id,
      vehicle: { make: 'Toyota', model: 'Corolla', year: 2018, licensePlate: 'ABC123', vin: 'JT123456789012345', mileage: 55000 },
      serviceType: 'oil-change',
      description: 'Routine oil change',
      priority: 'medium',
      status: 'pending',
      scheduledDate: addHours(now, 24),
      estimatedDuration: 1,
      estimatedCost: 40
    },
    {
      customer: customer._id,
      vehicle: { make: 'Honda', model: 'Civic', year: 2020, licensePlate: 'CIV2020', mileage: 30000 },
      serviceType: 'brake-service',
      description: 'Brake pads inspection and replacement',
      priority: 'high',
      status: 'confirmed',
      scheduledDate: addHours(now, 48),
      estimatedDuration: 2,
      estimatedCost: 150
    },
    {
      customer: customer._id,
      vehicle: { make: 'Ford', model: 'F-150', year: 2017, licensePlate: 'TRK777', mileage: 80000 },
      serviceType: 'engine-diagnostic',
      description: 'Check engine light on',
      priority: 'urgent',
      status: 'in-progress',
      scheduledDate: addHours(now, -2),
      startTime: addHours(now, -2),
      estimatedDuration: 2,
      estimatedCost: 100
    },
    {
      customer: customer._id,
      vehicle: { make: 'BMW', model: '320i', year: 2019, licensePlate: 'BMW320', mileage: 42000 },
      serviceType: 'general-inspection',
      description: 'Annual inspection',
      priority: 'low',
      status: 'completed',
      scheduledDate: addHours(now, -48),
      startTime: addHours(now, -48),
      endTime: addHours(now, -46),
      estimatedDuration: 1,
      actualCost: 55
    }
  ];

  const created = await Appointment.insertMany(samples);
  console.log(`Inserted ${created.length} appointments`);
  created.forEach(a => console.log(`- ${a._id} ${a.serviceType} ${a.status} ${a.vehicle.make} ${a.vehicle.model}`));
}

async function list() {
  const docs = await Appointment.find({}).sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${docs.length} appointment(s)`);
  docs.forEach(a => {
    console.log(`${a._id} | ${a.status} | ${a.serviceType} | ${a.scheduledDate?.toISOString()} | ${a.vehicle?.make} ${a.vehicle?.model}`);
  });
}

async function updateStatus() {
  const id = arg('id');
  const status = arg('status');
  if (!id || !status) {
    console.error('Usage: node scripts/appointments-cli.js update-status --id=<ID> --status=<pending|confirmed|in-progress|waiting-parts|completed|cancelled>');
    process.exit(1);
  }
  const a = await Appointment.findById(id);
  if (!a) {
    console.error('Appointment not found');
    process.exit(1);
  }
  const old = a.status;
  a.status = status;
  if (status === 'in-progress' && !a.startTime) a.startTime = new Date();
  if (status === 'completed' && !a.endTime) a.endTime = new Date();
  await a.save();
  console.log(`Updated ${id}: ${old} -> ${status}`);
}

async function cancel() {
  const id = arg('id');
  if (!id) {
    console.error('Usage: node scripts/appointments-cli.js cancel --id=<ID>');
    process.exit(1);
  }
  const a = await Appointment.findById(id);
  if (!a) {
    console.error('Appointment not found');
    process.exit(1);
  }
  if (!['pending', 'confirmed'].includes(a.status)) {
    console.error('Only pending or confirmed appointments can be cancelled');
    process.exit(1);
  }
  a.status = 'cancelled';
  a.endTime = new Date();
  await a.save();
  console.log(`Cancelled appointment ${id}`);
}

async function del() {
  const id = arg('id');
  if (!id) {
    console.error('Usage: node scripts/appointments-cli.js delete --id=<ID>');
    process.exit(1);
  }
  const res = await Appointment.deleteOne({ _id: id });
  console.log(`Deleted count: ${res.deletedCount}`);
}

(async function main() {
  await connectDB();
  try {
    if (action === 'seed') await seed();
    else if (action === 'list') await list();
    else if (action === 'update-status') await updateStatus();
    else if (action === 'cancel') await cancel();
    else if (action === 'delete') await del();
    else {
      console.log('Unknown action. Use: seed | list | update-status | cancel | delete');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
