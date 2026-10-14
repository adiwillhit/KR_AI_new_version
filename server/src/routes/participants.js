import { Router } from 'express';
import { body } from 'express-validator';
import { participantController } from '../controllers/participantController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', participantController.getByProject);

router.post(
  '/',
  [
    body('projectId').notEmpty().withMessage('Project ID is required.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().trim(),
    body('speakerLabel').optional().trim(),
  ],
  validate,
  participantController.create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('speakerLabel').optional().trim(),
  ],
  validate,
  participantController.update
);

router.delete('/:id', participantController.delete);

export default router;
