import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/config.js';
import { successResponse } from '../utils/response.js';

const execAsync = promisify(exec);

export const systemController = {
  async getStatus(req, res, next) {
    try {
      const status = {
        database: {
          connected: mongoose.connection.readyState === 1,
          name: 'MongoDB',
        },
        ollama: {
          available: false,
          model: config.ollama.model,
          baseUrl: config.ollama.baseUrl,
        },
        whisper: {
          available: false,
        },
        smtp: {
          configured: Boolean(config.email.host && config.email.user),
          host: config.email.host || 'Not configured (Simulation mode active)',
        },
      };

      // Test Ollama
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(`${config.ollama.baseUrl}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) status.ollama.available = true;
      } catch {
        status.ollama.available = false;
      }

      // Test Whisper CLI
      try {
        await execAsync('whisper --version');
        status.whisper.available = true;
      } catch {
        status.whisper.available = false;
      }

      successResponse(res, { status });
    } catch (err) { next(err); }
  },
};
