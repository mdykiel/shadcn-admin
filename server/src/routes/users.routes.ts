import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Wszystkie trasy wymagają autentykacji
router.use(authenticate);

// Użytkownicy w kontekście jednostki
router.get('/unit/:unitId', usersController.getByUnit);
router.post('/unit/:unitId', usersController.create);
router.put('/unit/:unitId/:id', usersController.update);
router.delete('/unit/:unitId/:id', usersController.removeFromUnit);
router.post('/unit/:unitId/:id/roles', usersController.assignRoles);

// Operacje na pojedynczym użytkowniku
router.get('/:id', usersController.getById);
router.patch('/:id/status', usersController.updateStatus);
router.post('/:id/reset-password', usersController.resetPassword);

export default router;

