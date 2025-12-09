import { Request, Response } from 'express'
import * as plansService from '../services/plans.service.js'

// ================== Financial Plans ==================

export async function getPlans(req: Request, res: Response) {
  try {
    const { unitId } = req.params
    const { year } = req.query
    const plans = await plansService.getPlans(unitId, year ? parseInt(year as string) : undefined)
    res.json(plans)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export async function getPlanById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const plan = await plansService.getPlanById(id)
    if (!plan) {
      return res.status(404).json({ error: 'Plan nie został znaleziony' })
    }
    res.json(plan)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export async function createPlan(req: Request, res: Response) {
  try {
    const { unitId } = req.params
    const plan = await plansService.createPlan({ unitId, ...req.body })
    res.status(201).json(plan)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function updatePlan(req: Request, res: Response) {
  try {
    const { id } = req.params
    const plan = await plansService.updatePlan(id, req.body)
    res.json(plan)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function deletePlan(req: Request, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user?.id
    await plansService.deletePlan(id, userId)
    res.status(204).send()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function approvePlan(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { approvedBy } = req.body
    const plan = await plansService.approvePlan(id, approvedBy || 'System')
    res.json(plan)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// ================== Plan Items ==================

export async function addPlanItem(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const item = await plansService.addPlanItem(planId, req.body)
    res.status(201).json(item)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function updatePlanItem(req: Request, res: Response) {
  try {
    const { itemId } = req.params
    const item = await plansService.updatePlanItem(itemId, req.body)
    res.json(item)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function deletePlanItem(req: Request, res: Response) {
  try {
    const { itemId } = req.params
    await plansService.deletePlanItem(itemId)
    res.status(204).send()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// ================== Change Requests ==================

export async function getChangeRequests(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const requests = await plansService.getChangeRequests(planId)
    res.json(requests)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export async function createChangeRequest(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const request = await plansService.createChangeRequest(planId, req.body)
    res.status(201).json(request)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function updateChangeRequestStatus(req: Request, res: Response) {
  try {
    const { requestId } = req.params
    const request = await plansService.updateChangeRequestStatus(requestId, req.body)
    res.json(request)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function approveChangeRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params
    const { approvedBy } = req.body
    const newPlan = await plansService.approveChangeRequest(requestId, approvedBy || 'System')
    res.json(newPlan)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function deleteChangeRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params
    await plansService.deleteChangeRequest(requestId)
    res.status(204).send()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export async function submitChangeRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params
    const request = await plansService.submitChangeRequest(requestId)
    res.json(request)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// ================== Plan Changes ==================

export async function getPlanChanges(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const changes = await plansService.getPlanChanges(planId)
    res.json(changes)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export async function applyPlanChange(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const change = await plansService.applyPlanChange(planId, req.body)
    res.status(201).json(change)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

// ================== Summary ==================

export async function getPlanSummary(req: Request, res: Response) {
  try {
    const { planId } = req.params
    const summary = await plansService.getPlanSummary(planId)
    if (!summary) {
      return res.status(404).json({ error: 'Plan nie został znaleziony' })
    }
    res.json(summary)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

