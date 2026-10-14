import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { createError } from '../utils/response.js';

export const authService = {
  /**
   * Register a new user.
   */
  async register({ name, email, password }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw createError('An account with this email already exists.', 409);
    }

    const user = new User({ name, email, passwordHash: password });
    await user.save();

    const token = generateToken(user._id.toString());
    return { user, token };
  },

  /**
   * Authenticate a user and return a JWT.
   */
  async login({ email, password }) {
    // Must include passwordHash which is select:false
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw createError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid email or password.', 401);
    }

    const token = generateToken(user._id.toString());
    return { user, token };
  },

  /**
   * Return the current authenticated user.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found.', 404);
    }
    return user;
  },
};
