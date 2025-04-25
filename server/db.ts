import mongoose from 'mongoose';
import { log } from './vite';

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    log('✅ Connected to MongoDB Atlas', 'mongodb');

    // Handle database connection events
    mongoose.connection.on('error', (err) => {
      log(`MongoDB connection error: ${err}`, 'mongodb');
    });

    mongoose.connection.on('disconnected', () => {
      log('MongoDB disconnected', 'mongodb');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      log('MongoDB connection closed due to app termination', 'mongodb');
      process.exit(0);
    });
  } catch (error: any) {
    log(`❌ MongoDB connection error: ${error.message}`, 'mongodb');
    // Exit with failure if we can't connect to the database
    process.exit(1);
  }
};

export { connectDB };