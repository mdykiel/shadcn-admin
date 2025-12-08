import { Router } from 'express';
import { classificationsController } from '../controllers/classifications.controller.js';
import { authenticate, authorizeUnit } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes for unit's classifications
router.get('/unit/:unitId', authorizeUnit, classificationsController.getAll);
router.get('/unit/:unitId/tree', authorizeUnit, classificationsController.getTree);
router.get('/unit/:unitId/:id', authorizeUnit, classificationsController.getById);
router.post('/unit/:unitId', authorizeUnit, classificationsController.create);
router.put('/unit/:unitId/:id', authorizeUnit, classificationsController.update);
router.delete('/unit/:unitId/:id', authorizeUnit, classificationsController.delete);
router.patch('/unit/:unitId/:id/toggle-active', authorizeUnit, classificationsController.toggleActive);

export default router;

