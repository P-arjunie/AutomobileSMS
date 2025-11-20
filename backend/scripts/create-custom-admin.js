import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory (since we are in a module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend root
dotenv.config({ path: join(__dirname, '../.env') });

const createCustomAdmin = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automobile_sms';
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'asharathenuwara@gmail.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      // If it exists, maybe we update it to be admin?
      // For now, let's just notify.
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      firstName: 'Ashara',
      lastName: 'Thenuwara',
      email: email,
      password: 'Admin1234$', 
      phone: '0771234567', // Dummy phone number
      role: 'admin',
      department: 'management',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log('Password: Admin1234$');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createCustomAdmin();
