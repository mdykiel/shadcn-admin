import { Request, Response, NextFunction } from 'express';
import { journalsService } from '../services/journals.service.js';
import { createJournalSchema, updateJournalSchema } from '../validators/journals.validator.js';

export const journalsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.params.unitId;
      const includeInactive = req.query.includeInactive === 'true';
      const journals = await journalsService.getAll(unitId, includeInactive);
      res.json(journals);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const journal = await journalsService.getById(id, unitId);
      res.json(journal);
    } catch (error) {
      next(error);
    }
  },

  async getDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const journal = await journalsService.getDefault(unitId);
      res.json(journal);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createJournalSchema.parse({
        ...req.body,
        unitId: req.params.unitId,
      });
      const journal = await journalsService.create(data);
      res.status(201).json(journal);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const data = updateJournalSchema.parse(req.body);
      const journal = await journalsService.update(id, unitId, data);
      res.json(journal);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const result = await journalsService.delete(id, unitId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const journal = await journalsService.toggleActive(id, unitId);
      res.json(journal);
    } catch (error) {
      next(error);
    }
  },
};

