import mongoose from 'mongoose';
import { log } from './vite';

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    log(`Attempting to connect to MongoDB...`, 'mongodb');
    
    // Set mongoose connection options
    mongoose.set('strictQuery', false);
    
    // Connect with more options for better reliability
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    log('✅ Connected to MongoDB Atlas successfully', 'mongodb');

    // Handle database connection events
    mongoose.connection.on('error', (err) => {
      log(`MongoDB connection error: ${err}`, 'mongodb');
    });

    mongoose.connection.on('disconnected', () => {
      log('MongoDB disconnected', 'mongodb');
    });

    mongoose.connection.on('connected', () => {
      log('MongoDB connection established', 'mongodb');
    });

    mongoose.connection.on('reconnected', () => {
      log('MongoDB reconnected', 'mongodb');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        log('MongoDB connection closed due to app termination', 'mongodb');
        process.exit(0);
      } catch (err: any) {
        log(`Error closing MongoDB connection: ${err.message}`, 'mongodb');
        process.exit(1);
      }
    });
    
    return Promise.resolve();
  } catch (error: any) {
    log(`❌ MongoDB connection error: ${error.message}`, 'mongodb');
    // Don't exit, allow application to continue with fallback
    return Promise.reject(error);
  }
};

export { connectDB };