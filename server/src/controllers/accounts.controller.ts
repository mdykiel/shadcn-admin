import { Request, Response, NextFunction } from 'express';
import { accountsService } from '../services/accounts.service.js';
import { createAccountSchema, updateAccountSchema } from '../validators/accounts.validator.js';

export const accountsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const journalId = req.query.journalId as string | undefined;
      const fiscalPeriodId = req.query.fiscalPeriodId as string | undefined;
      const accounts = await accountsService.getAll(unitId, journalId, fiscalPeriodId);
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  },

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const journalId = req.query.journalId as string | undefined;
      const fiscalPeriodId = req.query.fiscalPeriodId as string | undefined;
      const accounts = await accountsService.getTree(unitId, journalId, fiscalPeriodId);
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const account = await accountsService.getById(id, unitId);
      res.json(account);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAccountSchema.parse({
        ...req.body,
        unitId: req.params.unitId,
      });
      const account = await accountsService.create(data);
      res.status(201).json(account);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const data = updateAccountSchema.parse(req.body);
      const account = await accountsService.update(id, unitId, data);
      res.json(account);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const result = await accountsService.delete(id, unitId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteMany(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Wymagana jest lista ID kont do usunięcia' });
      }

      const result = await accountsService.deleteMany(ids, unitId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const account = await accountsService.toggleActive(id, unitId);
      res.json(account);
    } catch (error) {
      next(error);
    }
  },

  async copyToFiscalPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const { sourceFiscalPeriodId, targetFiscalPeriodId, journalId } = req.body;

      if (!sourceFiscalPeriodId || !targetFiscalPeriodId) {
        return res.status(400).json({ message: 'Wymagane są ID okresu źródłowego i docelowego' });
      }

      const result = await accountsService.copyToFiscalPeriod(
        unitId,
        sourceFiscalPeriodId,
        targetFiscalPeriodId,
        journalId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async copyToJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const { accountIds, targetJournalId, targetFiscalPeriodId } = req.body;

      if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
        return res.status(400).json({ message: 'Wymagana jest lista ID kont do skopiowania' });
      }

      if (!targetJournalId) {
        return res.status(400).json({ message: 'Wymagane jest ID dziennika docelowego' });
      }

      if (!targetFiscalPeriodId) {
        return res.status(400).json({ message: 'Wymagane jest ID okresu obrachunkowego' });
      }

      const result = await accountsService.copyToJournal(
        unitId,
        accountIds,
        targetJournalId,
        targetFiscalPeriodId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async initializeFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const { journalId, fiscalPeriodId, unitType } = req.body;

      if (!journalId || !fiscalPeriodId || !unitType) {
        return res.status(400).json({
          message: 'Wymagane są: journalId, fiscalPeriodId i unitType',
        });
      }

      const validUnitTypes = ['JST', 'JEDNOSTKA_BUDZETOWA', 'ZAKLAD_BUDZETOWY'];
      if (!validUnitTypes.includes(unitType)) {
        return res.status(400).json({
          message: `Nieprawidłowy typ jednostki. Dozwolone: ${validUnitTypes.join(', ')}`,
        });
      }

      const result = await accountsService.initializeFromTemplate(
        unitId,
        journalId,
        fiscalPeriodId,
        unitType
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

