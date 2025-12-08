import { Router } from 'express';
import { accountsController } from '../controllers/accounts.controller.js';
import { authenticate, authorizeUnit } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes for unit's accounts
router.get('/unit/:unitId', authorizeUnit, accountsController.getAll);
router.get('/unit/:unitId/tree', authorizeUnit, accountsController.getTree);
router.get('/unit/:unitId/:id', authorizeUnit, accountsController.getById);
router.post('/unit/:unitId', authorizeUnit, accountsController.create);
router.post('/unit/:unitId/copy-to-period', authorizeUnit, accountsController.copyToFiscalPeriod);
router.post('/unit/:unitId/copy-to-journal', authorizeUnit, accountsController.copyToJournal);
router.post('/unit/:unitId/initialize-from-template', authorizeUnit, accountsController.initializeFromTemplate);
router.put('/unit/:unitId/:id', authorizeUnit, accountsController.update);
router.delete('/unit/:unitId/:id', authorizeUnit, accountsController.delete);
router.post('/unit/:unitId/delete-many', authorizeUnit, accountsController.deleteMany);
router.patch('/unit/:unitId/:id/toggle-active', authorizeUnit, accountsController.toggleActive);

export default router;

