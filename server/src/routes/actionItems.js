import { Router } from 'express';
import { actionItemController } from '../controllers/actionItemController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', actionItemController.getAll);
router.patch('/:id', actionItemController.update);
router.delete('/:id', actionItemController.delete);

export default router;
