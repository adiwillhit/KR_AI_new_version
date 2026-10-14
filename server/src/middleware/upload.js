import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config.js';

// Ensure upload directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = [
  'audio/mpeg',       // .mp3
  'audio/wav',        // .wav
  'audio/x-wav',
  'audio/mp4',        // .m4a
  'audio/x-m4a',
  'video/mp4',        // .mp4
  'text/plain',       // .txt
];

const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.txt'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
  },
});
