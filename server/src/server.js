import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { connectDB } from './config/database.js';
import { config } from './config/config.js';
import { queueManager } from './queues/queueManager.js';
import app from './app.js';

async function startServer() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Initialize queue manager (BullMQ or in-memory runner)
  await queueManager.init();

  // 3. Start HTTP server
  const server = app.listen(config.port, () => {
    console.log(`[Server] Running in ${config.env} mode on port ${config.port}`);
    console.log(`[Server] API available at http://localhost:${config.port}/api`);
  });

  // 4. Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 5. Unhandled rejection guard
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Rejection:', reason);
  });
}

startServer();
