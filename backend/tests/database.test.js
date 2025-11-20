import mongoose from 'mongoose';
import User from '../models/User.js';

// MongoDB connection setup
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI ;
  try {
    await mongoose.connect(mongoUri, { dbName: 'test' });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('✓ Disconnected from MongoDB');
};

describe('MongoDB Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('User Model - CRUD Operations', () => {
    it('should create a new user in database', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'HashedPassword123',
        phone: '0712345678',
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.email).toBe('john@example.com');
      expect(user.firstName).toBe('John');
    });

    it('should find user by email', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'HashedPassword123',
        phone: '0712345679',
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ email: 'jane@example.com' });
      expect(foundUser).toBeDefined();
      expect(foundUser.firstName).toBe('Jane');
    });

    it('should update user information', async () => {
      const userData = {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        password: 'HashedPassword123',
        phone: '0712345680',
      };

      const user = new User(userData);
      await user.save();

      user.firstName = 'Robert';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('Robert');
    });

    it('should delete user from database', async () => {
      const userData = {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@example.com',
        password: 'HashedPassword123',
        phone: '0712345681',
      };

      const user = new User(userData);
      await user.save();

      await User.deleteOne({ _id: user._id });

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should find user by ID', async () => {
      const userData = {
        firstName: 'Charlie',
        lastName: 'Davis',
        email: 'charlie@example.com',
        password: 'HashedPassword123',
        phone: '0712345682',
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('charlie@example.com');
    });
  });
});
