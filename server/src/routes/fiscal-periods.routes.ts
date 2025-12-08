import { Router } from 'express'
import { fiscalPeriodsController } from '../controllers/fiscal-periods.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', fiscalPeriodsController.getAll)
router.get('/active', fiscalPeriodsController.getActive)
router.get('/:id', fiscalPeriodsController.getById)
router.post('/', fiscalPeriodsController.create)
router.put('/:id', fiscalPeriodsController.update)
router.delete('/:id', fiscalPeriodsController.delete)
router.post('/:id/set-active', fiscalPeriodsController.setActive)
router.post('/:id/close', fiscalPeriodsController.close)

export default router

