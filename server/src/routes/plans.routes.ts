import { Router } from 'express'
import * as plansController from '../controllers/plans.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ================== Financial Plans ==================
// GET /api/plans/unit/:unitId - Get all plans for a unit
router.get('/unit/:unitId', plansController.getPlans)

// GET /api/plans/:id - Get plan by ID
router.get('/:id', plansController.getPlanById)

// POST /api/plans/unit/:unitId - Create new plan
router.post('/unit/:unitId', plansController.createPlan)

// PATCH /api/plans/:id - Update plan
router.patch('/:id', plansController.updatePlan)

// DELETE /api/plans/:id - Delete plan
router.delete('/:id', plansController.deletePlan)

// POST /api/plans/:id/approve - Approve plan (PROJEKT -> ZATWIERDZONY)
router.post('/:id/approve', plansController.approvePlan)

// ================== Plan Items ==================
// POST /api/plans/:planId/items - Add item to plan
router.post('/:planId/items', plansController.addPlanItem)

// PATCH /api/plans/items/:itemId - Update plan item
router.patch('/items/:itemId', plansController.updatePlanItem)

// DELETE /api/plans/items/:itemId - Delete plan item
router.delete('/items/:itemId', plansController.deletePlanItem)

// ================== Change Requests ==================
// GET /api/plans/:planId/change-requests - Get all change requests for a plan
router.get('/:planId/change-requests', plansController.getChangeRequests)

// POST /api/plans/:planId/change-requests - Create change request
router.post('/:planId/change-requests', plansController.createChangeRequest)

// PATCH /api/plans/change-requests/:requestId/status - Update change request status
router.patch('/change-requests/:requestId/status', plansController.updateChangeRequestStatus)

// POST /api/plans/change-requests/:requestId/approve - Approve change request and create new plan
router.post('/change-requests/:requestId/approve', plansController.approveChangeRequest)

// DELETE /api/plans/change-requests/:requestId - Delete change request
router.delete('/change-requests/:requestId', plansController.deleteChangeRequest)

// POST /api/plans/change-requests/:requestId/submit - Submit change request (DRAFT -> SUBMITTED)
router.post('/change-requests/:requestId/submit', plansController.submitChangeRequest)

// ================== Plan Changes ==================
// GET /api/plans/:planId/changes - Get all changes for a plan
router.get('/:planId/changes', plansController.getPlanChanges)

// POST /api/plans/:planId/changes - Apply change to plan
router.post('/:planId/changes', plansController.applyPlanChange)

// ================== Summary ==================
// GET /api/plans/:planId/summary - Get plan summary
router.get('/:planId/summary', plansController.getPlanSummary)

export default router

