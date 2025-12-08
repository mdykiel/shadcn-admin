import { Router } from 'express'
import { operationsController } from '../controllers/operations.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Operations CRUD
router.get('/unit/:unitId', operationsController.getAll)
router.get('/:id', operationsController.getById)
router.post('/unit/:unitId', operationsController.create)
router.put('/:id', operationsController.update)
router.patch('/:id/status', operationsController.updateStatus)
router.delete('/:id', operationsController.delete)

// Journal Entries
router.post('/:operationId/entries', operationsController.addEntry)
router.put('/entries/:entryId', operationsController.updateEntry)
router.delete('/entries/:entryId', operationsController.deleteEntry)

export default router

