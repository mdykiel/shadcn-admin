import { Request, Response, NextFunction } from 'express';
import { unitsService } from '../services/units.service.js';
import { createUnitSchema, updateUnitSchema } from '../validators/units.validator.js';

export const unitsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
      const units = await unitsService.getAll(req.user.id);
      res.json(units);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
      const unit = await unitsService.getById(req.params.id, req.user.id);
      res.json(unit);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
      const data = createUnitSchema.parse(req.body);
      const unit = await unitsService.create(req.user.id, data);
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
      const data = updateUnitSchema.parse(req.body);
      const unit = await unitsService.update(req.params.id, req.user.id, data);
      res.json(unit);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
      const result = await unitsService.delete(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

