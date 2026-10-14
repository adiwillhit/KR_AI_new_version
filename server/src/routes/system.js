import { Router } from 'express';
import { systemController } from '../controllers/systemController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/status', systemController.getStatus);

export default router;
