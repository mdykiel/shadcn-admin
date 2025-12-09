import { Request, Response, NextFunction } from 'express';
import { rolesService } from '../services/roles.service.js';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Nazwa roli jest wymagana'),
  code: z.string().min(1, 'Kod roli jest wymagany').max(30),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const copyRoleSchema = z.object({
  name: z.string().min(1, 'Nazwa nowej roli jest wymagana'),
  code: z.string().min(1, 'Kod nowej roli jest wymagany').max(30),
});

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  journalId: z.string().uuid().nullable().optional(),
  fiscalPeriodId: z.string().uuid().nullable().optional(),
});

export const rolesController = {
  // ============ UPRAWNIENIA ============

  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await rolesService.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  },

  // ============ ROLE ============

  async getRolesByUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const roles = await rolesService.getRolesByUnit(unitId);
      res.json(roles);
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await rolesService.getRoleById(id);
      res.json(role);
    } catch (error) {
      next(error);
    }
  },

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const data = createRoleSchema.parse(req.body);
      const role = await rolesService.createRole(unitId, data);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateRoleSchema.parse(req.body);
      const role = await rolesService.updateRole(id, data);
      res.json(role);
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await rolesService.deleteRole(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async copyRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, id } = req.params;
      const { name, code } = copyRoleSchema.parse(req.body);
      const role = await rolesService.copyRole(id, unitId, name, code);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  },

  // ============ SPRAWDZANIE UPRAWNIEŃ ============

  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, userId } = req.params;
      const { journalId, fiscalPeriodId } = req.query;

      const permissions = await rolesService.getUserPermissions(
        userId,
        unitId,
        journalId as string | undefined,
        fiscalPeriodId as string | undefined
      );
      res.json({ permissions });
    } catch (error) {
      next(error);
    }
  },

  async checkPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, userId } = req.params;
      const { permission, journalId, fiscalPeriodId } = req.query;

      if (!permission || typeof permission !== 'string') {
        return res.status(400).json({ error: 'Parametr permission jest wymagany' });
      }

      const hasPermission = await rolesService.userHasPermission(
        userId,
        unitId,
        permission,
        journalId as string | undefined,
        fiscalPeriodId as string | undefined
      );
      res.json({ hasPermission });
    } catch (error) {
      next(error);
    }
  },

  // ============ PRZYPISANIA RÓL ============

  async getUserRoleAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, userId } = req.params;
      const assignments = await rolesService.getUserRoleAssignments(userId, unitId);
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  },

  async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.params;
      const data = assignRoleSchema.parse(req.body);

      const assignment = await rolesService.assignRoleToUser(
        data.userId,
        data.roleId,
        unitId,
        data.journalId,
        data.fiscalPeriodId
      );
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  },

  async removeRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await rolesService.removeRoleAssignment(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

