import { Router } from 'express';
import { journalsController } from '../controllers/journals.controller.js';
import { authenticate, authorizeUnit } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes for unit's journals
router.get('/unit/:unitId', authorizeUnit, journalsController.getAll);
router.get('/unit/:unitId/default', authorizeUnit, journalsController.getDefault);
router.get('/unit/:unitId/:id', authorizeUnit, journalsController.getById);
router.post('/unit/:unitId', authorizeUnit, journalsController.create);
router.put('/unit/:unitId/:id', authorizeUnit, journalsController.update);
router.delete('/unit/:unitId/:id', authorizeUnit, journalsController.delete);
router.patch('/unit/:unitId/:id/toggle-active', authorizeUnit, journalsController.toggleActive);

export default router;

