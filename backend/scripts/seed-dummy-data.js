import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import ServiceLog from '../models/ServiceLog.js';

dotenv.config();

// Helper function to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seedDummyData = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automobile_sms';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await ServiceLog.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@admin.com',
      password: 'admin123',
      phone: '+1-555-0100',
      role: 'admin',
      employeeId: 'ADMIN001',
      department: 'management',
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create Employees
    console.log('👨‍🔧 Creating employees...');
    const employees = await User.create([
      {
        firstName: 'John',
        lastName: 'Mechanic',
        email: 'john.mechanic@example.com',
        password: 'password123',
        phone: '+1-555-0101',
        role: 'employee',
        employeeId: 'EMP001',
        department: 'mechanical',
        isActive: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Technician',
        email: 'sarah.tech@example.com',
        password: 'password123',
        phone: '+1-555-0102',
        role: 'employee',
        employeeId: 'EMP002',
        department: 'electrical',
        isActive: true
      },
      {
        firstName: 'Mike',
        lastName: 'Specialist',
        email: 'mike.specialist@example.com',
        password: 'password123',
        phone: '+1-555-0103',
        role: 'employee',
        employeeId: 'EMP003',
        department: 'bodywork',
        isActive: true
      },
      {
        firstName: 'Lisa',
        lastName: 'Painter',
        email: 'lisa.painter@example.com',
        password: 'password123',
        phone: '+1-555-0104',
        role: 'employee',
        employeeId: 'EMP004',
        department: 'painting',
        isActive: true
      },
      {
        firstName: 'David',
        lastName: 'Inspector',
        email: 'david.inspector@example.com',
        password: 'password123',
        phone: '+1-555-0105',
        role: 'employee',
        employeeId: 'EMP005',
        department: 'inspection',
        isActive: true
      }
    ]);
    console.log(`✅ Created ${employees.length} employees`);

    // Create Customers
    console.log('👥 Creating customers...');
    const customers = await User.create([
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        password: 'password123',
        phone: '+1-555-0201',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        password: 'password123',
        phone: '+1-555-0202',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie.brown@example.com',
        password: 'password123',
        phone: '+1-555-0203',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana.prince@example.com',
        password: 'password123',
        phone: '+1-555-0204',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Edward',
        lastName: 'Miller',
        email: 'edward.miller@example.com',
        password: 'password123',
        phone: '+1-555-0205',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Fiona',
        lastName: 'Davis',
        email: 'fiona.davis@example.com',
        password: 'password123',
        phone: '+1-555-0206',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'George',
        lastName: 'Wilson',
        email: 'george.wilson@example.com',
        password: 'password123',
        phone: '+1-555-0207',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Helen',
        lastName: 'Martinez',
        email: 'helen.martinez@example.com',
        password: 'password123',
        phone: '+1-555-0208',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Ian',
        lastName: 'Anderson',
        email: 'ian.anderson@example.com',
        password: 'password123',
        phone: '+1-555-0209',
        role: 'customer',
        isActive: true
      },
      {
        firstName: 'Julia',
        lastName: 'Taylor',
        email: 'julia.taylor@example.com',
        password: 'password123',
        phone: '+1-555-0210',
        role: 'customer',
        isActive: true
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // Vehicle data
    const vehicleMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Kia'];
    const vehicleModels = {
      'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
      'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
      'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Cruze'],
      'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
      'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A8'],
      'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Maxima'],
      'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona'],
      'Kia': ['Optima', 'Sorento', 'Sportage', 'Forte', 'Telluride']
    };

    const serviceTypes = [
      'oil-change',
      'brake-service',
      'tire-rotation',
      'engine-diagnostic',
      'transmission-service',
      'air-conditioning',
      'battery-service',
      'general-inspection',
      'bodywork',
      'painting',
      'other'
    ];

    const statuses = ['pending', 'confirmed', 'in-progress', 'waiting-parts', 'completed', 'cancelled'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    // Create Appointments
    console.log('📅 Creating appointments...');
    const appointments = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 50; i++) {
      const customer = randomItem(customers);
      const make = randomItem(vehicleMakes);
      const model = randomItem(vehicleModels[make]);
      const year = Math.floor(Math.random() * 25) + 2000; // 2000-2025
      const scheduledDate = randomDate(sixMonthsAgo, sixMonthsLater);
      const status = randomItem(statuses);
      const assignedEmployee = Math.random() > 0.3 ? randomItem(employees) : null; // 70% assigned
      
      // Calculate costs
      const baseCost = Math.random() * 500 + 50; // $50-$550
      const estimatedCost = Math.round(baseCost * 100) / 100;
      const actualCost = status === 'completed' 
        ? Math.round((estimatedCost * (0.9 + Math.random() * 0.2)) * 100) / 100 // ±10% variance
        : 0;

      const appointment = await Appointment.create({
        customer: customer._id,
        vehicle: {
          make,
          model,
          year,
          licensePlate: `${Math.random().toString(36).substring(2, 4).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
          vin: Math.random().toString(36).substring(2, 19).toUpperCase(),
          mileage: Math.floor(Math.random() * 200000) + 10000
        },
        serviceType: randomItem(serviceTypes),
        description: `Service request for ${make} ${model} ${year}. Customer reported issue requiring attention.`,
        priority: randomItem(priorities),
        status,
        scheduledDate,
        estimatedDuration: Math.floor(Math.random() * 6) + 1, // 1-7 hours
        assignedEmployee: assignedEmployee?._id || null,
        estimatedCost,
        actualCost,
        startTime: (status === 'in-progress' || status === 'completed') 
          ? new Date(scheduledDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null,
        endTime: status === 'completed' 
          ? new Date((status === 'completed' ? scheduledDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000 : scheduledDate.getTime()) + Math.random() * 8 * 60 * 60 * 1000)
          : null
      });

      appointments.push(appointment);

      // Create ServiceLogs for in-progress and completed appointments
      if (status === 'in-progress' || status === 'completed') {
        // Ensure startTime is in the past (or now for in-progress)
        const startTime = status === 'completed' 
          ? new Date(scheduledDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Past date
          : (scheduledDate < now ? scheduledDate : new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000));
        
        // For completed, ensure endTime is after startTime
        const endTime = status === 'completed' 
          ? new Date(startTime.getTime() + (Math.random() * 8 + 0.5) * 60 * 60 * 1000) // 0.5-8.5 hours later
          : null;
        
        // Calculate hours logged
        const hoursLogged = endTime 
          ? Math.max(0.1, Math.round(((endTime - startTime) / (1000 * 60 * 60)) * 100) / 100)
          : Math.max(0.1, Math.round((Math.random() * 5 + 0.5) * 100) / 100); // 0.5-5.5 hours
        
        const parts = Math.random() > 0.5 ? [
          {
            name: 'Oil Filter',
            partNumber: 'OF-' + Math.floor(Math.random() * 10000),
            quantity: 1,
            cost: Math.round((Math.random() * 30 + 10) * 100) / 100
          },
          ...(Math.random() > 0.7 ? [{
            name: 'Brake Pads',
            partNumber: 'BP-' + Math.floor(Math.random() * 10000),
            quantity: 2,
            cost: Math.round((Math.random() * 100 + 50) * 100) / 100
          }] : [])
        ] : [];

        const laborCost = Math.round(hoursLogged * 75 * 100) / 100; // $75/hour

        await ServiceLog.create({
          appointment: appointment._id,
          employee: assignedEmployee?._id || randomItem(employees)._id,
          startTime,
          endTime,
          duration: Math.round(hoursLogged * 60),
          hoursLogged,
          description: `Work completed on ${make} ${model}. Service performed according to specifications.`,
          workType: randomItem(['diagnosis', 'repair', 'maintenance', 'inspection', 'parts-replacement', 'testing']),
          status: status === 'completed' ? 'completed' : 'in-progress',
          parts,
          laborCost,
          notes: Math.random() > 0.5 ? 'Customer satisfied with service quality.' : null
        });

        // Update appointment with correct times
        if (status === 'completed') {
          appointment.startTime = startTime;
          appointment.endTime = endTime;
          await appointment.save();
        } else if (status === 'in-progress') {
          appointment.startTime = startTime;
          await appointment.save();
        }
      }
    }

    console.log(`✅ Created ${appointments.length} appointments`);

    // Count ServiceLogs
    const serviceLogCount = await ServiceLog.countDocuments();
    console.log(`✅ Created ${serviceLogCount} service logs`);

    // Summary
    console.log('\n📊 Database Summary:');
    console.log(`   👤 Admin: 1`);
    console.log(`   👨‍🔧 Employees: ${employees.length}`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   📅 Appointments: ${appointments.length}`);
    console.log(`   📋 Service Logs: ${serviceLogCount}`);
    
    // Status breakdown
    const statusBreakdown = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📈 Appointment Status Breakdown:');
    statusBreakdown.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    console.log('\n✅ Dummy data seeding completed successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@admin.com / admin123');
    console.log('   Employee: john.mechanic@example.com / password123');
    console.log('   Customer: alice.johnson@example.com / password123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedDummyData();

