import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_assistant',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  },

  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 500,
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@meetingassistant.dev',
  },

  rag: {
    topK: parseInt(process.env.RAG_TOP_K, 10) || 5,
    chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 500,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 50,
  },
};
