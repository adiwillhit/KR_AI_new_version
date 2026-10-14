import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { config } from './config/config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import meetingRoutes from './routes/meetings.js';
import participantRoutes from './routes/participants.js';
import actionItemRoutes from './routes/actionItems.js';
import decisionRoutes from './routes/decisions.js';
import systemRoutes from './routes/system.js';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.env === 'development' ? 'http://localhost:5173' : (process.env.CLIENT_URL || true),
    credentials: true,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static Files (uploaded recordings served from /uploads) ──────────────────
app.use('/uploads', express.static(config.upload.dir));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Meeting Assistant API is running.', env: config.env });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/system', systemRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
