import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const resetTestUsers = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Delete test users
    const result = await User.deleteMany({ 
      email: { $in: ['admin@test.com', 'employee@test.com', 'customer@test.com'] } 
    });
    
    console.log(`✅ Deleted ${result.deletedCount} test users`);
    console.log('✅ You can now run: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  }
};

resetTestUsers();

