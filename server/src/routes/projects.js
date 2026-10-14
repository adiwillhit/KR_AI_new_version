import { Router } from 'express';
import { body } from 'express-validator';
import { projectController } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', projectController.getAll);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required.').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
  ],
  validate,
  projectController.create
);

router.get('/:id', projectController.getById);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['active', 'archived', 'completed']),
  ],
  validate,
  projectController.update
);

router.delete('/:id', projectController.delete);

router.post(
  '/:id/members',
  [
    body('memberId').notEmpty().withMessage('Member user ID is required.'),
    body('role').optional().isIn(['admin', 'member', 'viewer']),
  ],
  validate,
  projectController.addMember
);

router.delete('/:id/members/:memberId', projectController.removeMember);

export default router;
