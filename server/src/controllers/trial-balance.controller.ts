import { Request, Response, NextFunction } from 'express'
import { trialBalanceService } from '../services/trial-balance.service.js'

export const trialBalanceController = {
  async getTrialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.query.unitId as string
      const fiscalPeriodId = req.query.fiscalPeriodId as string | undefined
      const journalId = req.query.journalId as string | undefined
      const status = req.query.status as 'ZADEKRETOWANE' | 'ZAKSIEGOWANE' | undefined
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined

      if (!unitId) {
        return res.status(400).json({ error: 'unitId is required' })
      }

      const data = await trialBalanceService.getTrialBalance({
        unitId,
        fiscalPeriodId,
        journalId,
        status,
        dateFrom,
        dateTo,
      })

      res.json(data)
    } catch (error) {
      next(error)
    }
  },
}

