import { Router } from 'express';
import { unitsController } from '../controllers/units.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', unitsController.getAll);
router.get('/:id', unitsController.getById);
router.post('/', unitsController.create);
router.put('/:id', unitsController.update);
router.delete('/:id', unitsController.delete);

export default router;

