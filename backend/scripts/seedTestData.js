import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import TimeLog from '../models/TimeLog.js';
import connectDB from '../config/database.js';

const seedTestData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing test data (optional - comment out if you want to keep data)
    // await TimeLog.deleteMany({});
    // await Appointment.deleteMany({});
    
    // Delete existing test users to recreate them with correct passwords
    await User.deleteMany({ 
      email: { $in: ['admin@test.com', 'employee@test.com', 'customer@test.com'] } 
    });
    console.log('🗑️  Cleared existing test users');

    // Create or find Admin user
    let admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'admin',
        department: 'management',
        employeeId: 'ADM001',
        isActive: true
      });
      await admin.save();
      console.log('✅ Created Admin user');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create or find Employee user
    let employee = await User.findOne({ email: 'employee@test.com' });
    if (!employee) {
      employee = new User({
        firstName: 'John',
        lastName: 'Mechanic',
        email: 'employee@test.com',
        password: 'password123',
        phone: '+1234567891',
        role: 'employee',
        department: 'mechanical',
        employeeId: 'EMP001',
        isActive: true
      });
      await employee.save();
      console.log('✅ Created Employee user');
    } else {
      console.log('✅ Employee user already exists');
    }

    // Create or find Customer user
    let customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      customer = new User({
        firstName: 'Jane',
        lastName: 'Customer',
        email: 'customer@test.com',
        password: 'password123',
        phone: '+1234567892',
        role: 'customer',
        isActive: true
      });
      await customer.save();
      console.log('✅ Created Customer user');
    } else {
      console.log('✅ Customer user already exists');
    }

    // Create test appointments and assign to employee
    const today = new Date();
    const appointments = [];

    // Appointment 1: Today - In Progress
    const appointment1 = new Appointment({
      customer: customer._id,
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        vin: '1HGBH41JXMN109186',
        mileage: 35000
      },
      serviceType: 'oil-change',
      description: 'Regular oil change and filter replacement',
      priority: 'medium',
      status: 'in-progress',
      scheduledDate: today,
      estimatedDuration: 1,
      assignedEmployee: employee._id,
      estimatedCost: 50,
      startTime: new Date(today.getTime() - 30 * 60 * 1000) // Started 30 mins ago
    });
    await appointment1.save();
    appointments.push(appointment1);
    console.log('✅ Created Appointment 1 (In Progress)');

    // Appointment 2: Tomorrow - Confirmed
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointment2 = new Appointment({
      customer: customer._id,
      vehicle: {
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        licensePlate: 'XYZ789',
        vin: '2HGBH41JXMN109187',
        mileage: 42000
      },
      serviceType: 'brake-service',
      description: 'Brake pad replacement and inspection',
      priority: 'high',
      status: 'confirmed',
      scheduledDate: tomorrow,
      estimatedDuration: 2,
      assignedEmployee: employee._id,
      estimatedCost: 250
    });
    await appointment2.save();
    appointments.push(appointment2);
    console.log('✅ Created Appointment 2 (Confirmed - Tomorrow)');

    // Appointment 3: Day after tomorrow - Confirmed
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const appointment3 = new Appointment({
      customer: customer._id,
      vehicle: {
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        licensePlate: 'DEF456',
        vin: '3HGBH41JXMN109188',
        mileage: 18000
      },
      serviceType: 'engine-diagnostic',
      description: 'Check engine light diagnostic',
      priority: 'urgent',
      status: 'confirmed',
      scheduledDate: dayAfter,
      estimatedDuration: 3,
      assignedEmployee: employee._id,
      estimatedCost: 150
    });
    await appointment3.save();
    appointments.push(appointment3);
    console.log('✅ Created Appointment 3 (Confirmed - Day After)');

    // Appointment 4: Last week - Completed
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const appointment4 = new Appointment({
      customer: customer._id,
      vehicle: {
        make: 'Nissan',
        model: 'Altima',
        year: 2018,
        licensePlate: 'GHI789',
        vin: '4HGBH41JXMN109189',
        mileage: 55000
      },
      serviceType: 'tire-rotation',
      description: 'Tire rotation and balance',
      priority: 'low',
      status: 'completed',
      scheduledDate: lastWeek,
      estimatedDuration: 1,
      assignedEmployee: employee._id,
      estimatedCost: 75,
      actualCost: 75,
      startTime: new Date(lastWeek.setHours(10, 0, 0, 0)),
      endTime: new Date(lastWeek.setHours(11, 0, 0, 0))
    });
    await appointment4.save();
    appointments.push(appointment4);
    console.log('✅ Created Appointment 4 (Completed - Last Week)');

    // Create time logs for testing
    const timeLogs = [];

    // Active timer for appointment 1 (started 30 mins ago)
    const activeTimer = new TimeLog({
      employee: employee._id,
      serviceProject: appointment1._id,
      startTime: new Date(today.getTime() - 30 * 60 * 1000),
      endTime: null,
      durationMinutes: 30,
      description: 'Oil change in progress',
      status: 'active'
    });
    await activeTimer.save();
    timeLogs.push(activeTimer);
    console.log('✅ Created Active Timer for Appointment 1');

    // Completed time log for appointment 4
    const completedLog = new TimeLog({
      employee: employee._id,
      serviceProject: appointment4._id,
      startTime: new Date(lastWeek.setHours(10, 0, 0, 0)),
      endTime: new Date(lastWeek.setHours(11, 0, 0, 0)),
      durationMinutes: 60,
      description: 'Tire rotation completed',
      status: 'completed'
    });
    await completedLog.save();
    timeLogs.push(completedLog);
    console.log('✅ Created Completed Time Log for Appointment 4');

    // Additional time logs for this week
    for (let i = 0; i < 5; i++) {
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - i);
      const startTime = new Date(logDate);
      startTime.setHours(9 + i, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2);

      const timeLog = new TimeLog({
        employee: employee._id,
        serviceProject: i % 2 === 0 ? appointment2._id : appointment3._id,
        startTime: startTime,
        endTime: endTime,
        durationMinutes: 120,
        description: `Work session ${i + 1}`,
        status: 'completed'
      });
      await timeLog.save();
      timeLogs.push(timeLog);
    }
    console.log('✅ Created 5 additional time logs');

    console.log('\n🎉 Test data seeding completed!');
    console.log('\n📋 Test Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍🔧 Employee:');
    console.log('   Email: employee@test.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Customer:');
    console.log('   Email: customer@test.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Created:');
    console.log(`   - ${appointments.length} Appointments`);
    console.log(`   - ${timeLogs.length} Time Logs`);
    console.log(`   - 1 Active Timer`);
    console.log('\n✅ You can now login as employee@test.com to see test data!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
};

seedTestData();

