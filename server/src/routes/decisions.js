import { Router } from 'express';
import { decisionController } from '../controllers/decisionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', decisionController.getAll);

export default router;
