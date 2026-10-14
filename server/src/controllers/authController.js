import { authService } from '../services/authService.js';
import { successResponse } from '../utils/response.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { user, token } = await authService.register({ name, email, password });
      successResponse(res, { user, token }, 201, 'Registration successful.');
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });
      successResponse(res, { user, token }, 200, 'Login successful.');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      successResponse(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res) {
    // JWT is stateless — logout is handled client-side by discarding the token.
    successResponse(res, null, 200, 'Logged out successfully.');
  },
};
