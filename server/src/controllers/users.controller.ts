import { Request, Response, NextFunction } from 'express';
import { usersService } from '../services/users.service.js';
import { z } from 'zod';

const roleAssignmentSchema = z.object({
  roleId: z.string().uuid(),
  journalId: z.string().uuid().nullable().optional(),
  fiscalPeriodId: z.string().uuid().nullable().optional(),
});

const createUserSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6).optional(),
  name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  roleAssignments: z.array(roleAssignmentSchema).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED']).optional(),
  roleIds: z.array(z.string()).optional(),
  roleAssignments: z.array(roleAssignmentSchema).optional(),
});

const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
});

export const usersController = {
  async getByUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const users = await usersService.getByUnit(unitId);
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await usersService.getById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const data = createUserSchema.parse(req.body);
      const user = await usersService.create(unitId, data);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const data = updateUserSchema.parse(req.body);
      const user = await usersService.update(id, unitId, data);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async removeFromUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const result = await usersService.removeFromUnit(id, unitId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await usersService.updateStatus(id, status);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const result = await usersService.resetPassword(id, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async assignRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const { roleIds } = assignRolesSchema.parse(req.body);
      const result = await usersService.assignRoles(id, unitId, roleIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

