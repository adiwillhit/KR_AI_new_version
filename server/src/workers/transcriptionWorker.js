/**
 * Dedicated Background Worker Process
 */
import mongoose from 'mongoose';
import { config } from '../config/config.js';
import { queueManager } from '../queues/queueManager.js';

async function startWorker() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('[Worker] Connected to MongoDB.');

    await queueManager.init();
    console.log('[Worker] Background worker listening for jobs.');
  } catch (err) {
    console.error('[Worker Error]', err);
    process.exit(1);
  }
}

startWorker();
