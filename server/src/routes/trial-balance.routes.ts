import { Router } from 'express'
import { trialBalanceController } from '../controllers/trial-balance.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/reports/trial-balance - Pobierz zestawienie obrotów i sald
router.get('/', authenticate, trialBalanceController.getTrialBalance)

export default router

