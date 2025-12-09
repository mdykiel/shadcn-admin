import { Router } from 'express';
import { rolesController } from '../controllers/roles.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Wszystkie trasy wymagają autentykacji
router.use(authenticate);

// Uprawnienia (globalne, bez kontekstu jednostki)
router.get('/permissions', rolesController.getAllPermissions);

// Role w kontekście jednostki
router.get('/unit/:unitId', rolesController.getRolesByUnit);
router.post('/unit/:unitId', rolesController.createRole);
router.put('/unit/:unitId/:id', rolesController.updateRole);
router.delete('/unit/:unitId/:id', rolesController.deleteRole);
router.post('/unit/:unitId/:id/copy', rolesController.copyRole);

// Operacje na pojedynczej roli (bez kontekstu jednostki)
router.get('/:id', rolesController.getRoleById);

// Sprawdzanie uprawnień użytkownika
router.get('/unit/:unitId/user/:userId/permissions', rolesController.getUserPermissions);
router.get('/unit/:unitId/user/:userId/check', rolesController.checkPermission);

// Przypisania ról użytkownika (z zakresami)
router.get('/unit/:unitId/user/:userId/assignments', rolesController.getUserRoleAssignments);
router.post('/unit/:unitId/assign', rolesController.assignRole);
router.delete('/assignment/:id', rolesController.removeRoleAssignment);

export default router;

