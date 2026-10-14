import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Generate a signed JWT for a user.
 * @param {string} userId - MongoDB _id of the user
 * @returns {string} signed JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}
