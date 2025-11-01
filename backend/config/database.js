import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Ensure database name is in the URI
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/automobile_sms';
    
    // If MongoDB Atlas URI doesn't have database name, add it
    if (mongoUri.includes('mongodb+srv://')) {
      // Parse the URI
      const urlParts = mongoUri.split('?');
      const baseUri = urlParts[0]; // Everything before ?
      const queryParams = urlParts[1] ? '?' + urlParts[1] : ''; // Everything after ?
      
      // Check if database name is already in the base URI
      // Format: mongodb+srv://user:pass@host/database
      if (!baseUri.match(/\/[^\/]+$/)) {
        // No database name found, add it
        const separator = baseUri.endsWith('/') ? '' : '/';
        mongoUri = baseUri + separator + 'automobile_sms' + queryParams;
      } else {
        mongoUri = mongoUri; // Already has database name
      }
    }
    
    const conn = await mongoose.connect(mongoUri, {
      // Remove deprecated options for newer mongoose versions
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  console.log(`📚  Database name: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
