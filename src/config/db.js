import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const connectDB = async () => {
  if (!env.mongoUri || typeof env.mongoUri !== 'string') {
    logger.error('MongoDB connection error: MONGODB_URI is missing or invalid in .env');
    logger.info('Falling back to local MongoDB: mongodb://localhost:27017/leads_scraper');
    env.mongoUri = 'mongodb://localhost:27017/leads_scraper';
  }

  try {
    logger.info(`Attempting to connect to MongoDB...`);
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    logger.info('✓ MongoDB connected successfully');
  } catch (error) {
    if (error.message.includes('querySrv ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      logger.error('✗ MongoDB Atlas connection failed (DNS/Network issue)');
      logger.info('Attempting fallback to local MongoDB...');
      
      try {
        await mongoose.connect('mongodb://localhost:27017/leads_scraper', {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        logger.info('✓ Connected to local MongoDB successfully');
        return;
      } catch (localError) {
        logger.error('✗ Local MongoDB connection also failed');
        logger.error('Please ensure MongoDB is running locally or fix Atlas connection');
        logger.error(`Atlas error: ${error.message}`);
        logger.error(`Local error: ${localError.message}`);
        process.exit(1);
      }
    } else {
      logger.error(`MongoDB connection error: ${error.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
