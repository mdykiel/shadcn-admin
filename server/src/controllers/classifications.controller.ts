import { Request, Response, NextFunction } from 'express';
import { classificationsService } from '../services/classifications.service.js';
import { createClassificationSchema, updateClassificationSchema } from '../validators/classifications.validator.js';

export const classificationsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const journalId = req.query.journalId as string | undefined;
      const type = req.query.type as string | undefined;
      const classifications = await classificationsService.getAll(unitId, journalId, type);
      res.json(classifications);
    } catch (error) {
      next(error);
    }
  },

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const journalId = req.query.journalId as string | undefined;
      const classifications = await classificationsService.getTree(unitId, journalId);
      res.json(classifications);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const classification = await classificationsService.getById(id, unitId);
      res.json(classification);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createClassificationSchema.parse({
        ...req.body,
        unitId: req.params.unitId,
      });
      const classification = await classificationsService.create(data);
      res.status(201).json(classification);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const data = updateClassificationSchema.parse(req.body);
      const classification = await classificationsService.update(id, unitId, data);
      res.json(classification);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const result = await classificationsService.delete(id, unitId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const classification = await classificationsService.toggleActive(id, unitId);
      res.json(classification);
    } catch (error) {
      next(error);
    }
  },
};

