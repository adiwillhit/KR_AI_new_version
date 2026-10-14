import { Router } from 'express';
import { body, param } from 'express-validator';
import { meetingController } from '../controllers/meetingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(authenticate);

// Validate MongoId helper
const validateId = [param('id').isMongoId().withMessage('Invalid meeting ID.'), validate];

// Dashboard stats
router.get('/dashboard', meetingController.getDashboard);

// Meetings across all user's projects
router.get('/', meetingController.getAll);

// Meetings within a project
router.get('/project/:projectId', meetingController.getByProject);

router.post(
  '/',
  [
    body('projectId').notEmpty().withMessage('Project ID is required.'),
    body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 300 }),
    body('date').isISO8601().withMessage('Valid date is required.'),
    body('duration').optional().isNumeric(),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('participantIds').optional().isArray(),
  ],
  validate,
  meetingController.create
);

router.get('/:id', validateId, meetingController.getById);

router.put(
  '/:id',
  validateId,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 300 }),
    body('date').optional().isISO8601(),
    body('duration').optional().isNumeric(),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
  ],
  validate,
  meetingController.update
);

router.delete('/:id', validateId, meetingController.delete);

// File upload — single file field named 'recording'
router.post('/:id/upload', validateId, upload.single('recording'), meetingController.uploadRecording);

// Phase 3 & 4 Sub-resource endpoints
router.post('/:id/reanalyze', validateId, meetingController.reanalyze);
router.get('/:id/decisions', validateId, meetingController.getDecisions);
router.get('/:id/action-items', validateId, meetingController.getActionItems);
router.get('/:id/risks-blockers', validateId, meetingController.getRisksAndBlockers);
router.post('/:id/chat', validateId, meetingController.chat);

// Phase 5 Export & Email
router.get('/:id/export', validateId, meetingController.exportMinutes);
router.post('/:id/send-email', validateId, meetingController.sendEmail);

export default router;
