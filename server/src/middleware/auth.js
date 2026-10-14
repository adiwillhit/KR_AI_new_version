import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { User } from '../models/User.js';

/**
 * Verify JWT and attach req.user to the request.
 * All protected routes must use this middleware.
 */
export async function authenticate(req, res, next) {
  try {
    let token;

    // Support Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}
