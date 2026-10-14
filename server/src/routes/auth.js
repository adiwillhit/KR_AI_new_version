import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

export default router;
