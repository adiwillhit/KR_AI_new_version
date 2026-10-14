import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    process.exit(1);
  }
}
