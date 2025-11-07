import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Determine base URI and ensure a database name is present
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/automobile_sms';

    if (mongoUri.includes('mongodb+srv://')) {
      const urlParts = mongoUri.split('?');
      const baseUri = urlParts[0];
      const queryParams = urlParts[1] ? '?' + urlParts[1] : '';

      // If baseUri doesn't end with a database name, append the default
      if (!baseUri.match(/\/[^\/]+$/)) {
        const separator = baseUri.endsWith('/') ? '' : '/';
        mongoUri = baseUri + separator + 'automobile_sms' + queryParams;
      }
    }

    const conn = await mongoose.connect(mongoUri);

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
