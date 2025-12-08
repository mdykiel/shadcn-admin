import { Request, Response, NextFunction } from 'express'
import { fiscalPeriodService } from '../services/fiscal-periods.service.js'

export const fiscalPeriodsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.query.unitId as string
      if (!unitId) {
        return res.status(400).json({ error: 'unitId is required' })
      }
      const periods = await fiscalPeriodService.getAll(unitId)
      res.json(periods)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await fiscalPeriodService.getById(req.params.id)
      if (!period) {
        return res.status(404).json({ error: 'Okres obrachunkowy nie znaleziony' })
      }
      res.json(period)
    } catch (error) {
      next(error)
    }
  },

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.query.unitId as string
      if (!unitId) {
        return res.status(400).json({ error: 'unitId is required' })
      }
      const period = await fiscalPeriodService.getActive(unitId)
      res.json(period)
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, name, startDate, endDate, isActive } = req.body
      if (!unitId || !name || !startDate || !endDate) {
        return res.status(400).json({ error: 'unitId, name, startDate and endDate are required' })
      }
      const period = await fiscalPeriodService.create({
        unitId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      })
      res.status(201).json(period)
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, startDate, endDate, isClosed, isActive } = req.body
      const period = await fiscalPeriodService.update(req.params.id, {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isClosed,
        isActive,
      })
      res.json(period)
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await fiscalPeriodService.delete(req.params.id)
      res.status(204).send()
    } catch (error: any) {
      if (error.message?.includes('Nie można usunąć')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  },

  async setActive(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await fiscalPeriodService.setActive(req.params.id)
      res.json(period)
    } catch (error) {
      next(error)
    }
  },

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await fiscalPeriodService.close(req.params.id)
      res.json(period)
    } catch (error) {
      next(error)
    }
  },
}

