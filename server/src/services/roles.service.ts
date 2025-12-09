import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export const rolesService = {
  // ============ UPRAWNIENIA ============
  
  // Pobierz wszystkie uprawnienia (zgrupowane po module)
  async getAllPermissions() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    // Grupuj po module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return { permissions, grouped };
  },

  // ============ ROLE ============

  // Pobierz wszystkie role dla jednostki (+ role systemowe globalne)
  async getRolesByUnit(unitId: string) {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { unitId },
          { unitId: null }, // Role globalne/systemowe
        ],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
      usersCount: role._count.userRoles,
    }));
  },

  // Pobierz pojedynczą rolę
  async getRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
        userRoles: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!role) {
      throw new AppError('Rola nie znaleziona', 404);
    }

    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
      users: role.userRoles.map(ur => ur.user),
    };
  },

  // Utwórz nową rolę
  async createRole(unitId: string, data: {
    name: string;
    code: string;
    description?: string;
    permissionIds: string[];
  }) {
    // Sprawdź unikalność kodu w jednostce
    const existing = await prisma.role.findFirst({
      where: { unitId, code: data.code },
    });

    if (existing) {
      throw new AppError(`Rola o kodzie "${data.code}" już istnieje`, 400);
    }

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          unitId,
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description,
          isSystem: false,
        },
      });

      // Przypisz uprawnienia
      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map(permissionId => ({
            roleId: newRole.id,
            permissionId,
          })),
        });
      }

      return newRole;
    });

    return this.getRoleById(role.id);
  },

  // Aktualizuj rolę
  async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
    permissionIds?: string[];
    isActive?: boolean;
  }) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new AppError('Rola nie znaleziona', 404);
    }

    if (role.isSystem && data.name) {
      throw new AppError('Nie można zmienić nazwy roli systemowej', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        },
      });

      // Aktualizuj uprawnienia jeśli podano
      if (data.permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        
        if (data.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissionIds.map(permissionId => ({
              roleId,
              permissionId,
            })),
          });
        }
      }

      return tx.role.findUnique({ where: { id: roleId } });
    });

    return this.getRoleById(roleId);
  },

  // Usuń rolę
  async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { userRoles: true } } },
    });

    if (!role) {
      throw new AppError('Rola nie znaleziona', 404);
    }

    if (role.isSystem) {
      throw new AppError('Nie można usunąć roli systemowej', 400);
    }

    if (role._count.userRoles > 0) {
      throw new AppError(`Rola jest przypisana do ${role._count.userRoles} użytkowników. Najpierw odepnij ich.`, 400);
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.role.delete({ where: { id: roleId } }),
    ]);

    return { success: true };
  },

  // Kopiuj rolę (utwórz nową na podstawie istniejącej)
  async copyRole(roleId: string, unitId: string, newName: string, newCode: string) {
    const sourceRole = await this.getRoleById(roleId);

    return this.createRole(unitId, {
      name: newName,
      code: newCode,
      description: `Kopia roli: ${sourceRole.name}`,
      permissionIds: sourceRole.permissions.map(p => p.id),
    });
  },

  // Sprawdź czy użytkownik ma uprawnienie w jednostce (z opcjonalnym zakresem dziennika/okresu)
  async userHasPermission(
    userId: string,
    unitId: string,
    permissionCode: string,
    journalId?: string | null,
    fiscalPeriodId?: string | null
  ): Promise<boolean> {
    // Sprawdź czy użytkownik jest adminem systemowym
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSystemAdmin: true },
    });

    if (user?.isSystemAdmin) {
      return true;
    }

    // Sprawdź uprawnienia przez role
    // UserRole może mieć:
    // - journalId = null -> dostęp do wszystkich dzienników
    // - journalId = konkretny -> dostęp tylko do tego dziennika
    // - fiscalPeriodId = null -> dostęp do wszystkich okresów
    // - fiscalPeriodId = konkretny -> dostęp tylko do tego okresu
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        unitId,
        OR: [
          { journalId: null }, // Dostęp do wszystkich dzienników
          ...(journalId ? [{ journalId }] : []),
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    for (const ur of userRoles) {
      // Sprawdź zakres okresu obrachunkowego
      if (fiscalPeriodId && ur.fiscalPeriodId !== null && ur.fiscalPeriodId !== fiscalPeriodId) {
        continue; // Ta rola nie ma dostępu do tego okresu
      }

      for (const rp of ur.role.permissions) {
        if (rp.permission.code === permissionCode) {
          return true;
        }
      }
    }

    return false;
  },

  // Pobierz wszystkie uprawnienia użytkownika w jednostce (z opcjonalnym zakresem)
  async getUserPermissions(
    userId: string,
    unitId: string,
    journalId?: string | null,
    fiscalPeriodId?: string | null
  ): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSystemAdmin: true },
    });

    // Admin systemowy ma wszystkie uprawnienia
    if (user?.isSystemAdmin) {
      const allPerms = await prisma.permission.findMany({ select: { code: true } });
      return allPerms.map(p => p.code);
    }

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        unitId,
        OR: [
          { journalId: null },
          ...(journalId ? [{ journalId }] : []),
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      // Sprawdź zakres okresu obrachunkowego
      if (fiscalPeriodId && ur.fiscalPeriodId !== null && ur.fiscalPeriodId !== fiscalPeriodId) {
        continue;
      }

      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.code);
      }
    }

    return Array.from(permissions);
  },

  // Pobierz wszystkie przypisania ról użytkownika w jednostce (z zakresami)
  async getUserRoleAssignments(userId: string, unitId: string) {
    const assignments = await prisma.userRole.findMany({
      where: { userId, unitId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        journal: {
          select: { id: true, name: true, shortName: true },
        },
        fiscalPeriod: {
          select: { id: true, name: true },
        },
      },
    });

    return assignments.map(a => ({
      id: a.id,
      role: {
        id: a.role.id,
        name: a.role.name,
        code: a.role.code,
        permissions: a.role.permissions.map(rp => rp.permission.code),
      },
      journal: a.journal,
      fiscalPeriod: a.fiscalPeriod,
      scope: a.journalId === null && a.fiscalPeriodId === null
        ? 'all'
        : a.journalId !== null && a.fiscalPeriodId !== null
          ? 'journal_and_period'
          : a.journalId !== null
            ? 'journal_only'
            : 'period_only',
    }));
  },

  // Przypisz rolę do użytkownika z zakresem
  async assignRoleToUser(
    userId: string,
    roleId: string,
    unitId: string,
    journalId?: string | null,
    fiscalPeriodId?: string | null
  ) {
    // Sprawdź czy rola istnieje
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Rola nie znaleziona', 404);
    }

    // Sprawdź czy użytkownik jest członkiem jednostki
    const membership = await prisma.userUnit.findFirst({
      where: { userId, unitId },
    });
    if (!membership) {
      throw new AppError('Użytkownik nie jest członkiem tej jednostki', 400);
    }

    // Utwórz przypisanie
    const assignment = await prisma.userRole.create({
      data: {
        userId,
        roleId,
        unitId,
        journalId: journalId || null,
        fiscalPeriodId: fiscalPeriodId || null,
      },
      include: {
        role: true,
        journal: true,
        fiscalPeriod: true,
      },
    });

    return assignment;
  },

  // Usuń przypisanie roli
  async removeRoleAssignment(assignmentId: string) {
    const assignment = await prisma.userRole.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new AppError('Przypisanie nie znalezione', 404);
    }

    await prisma.userRole.delete({ where: { id: assignmentId } });

    return { success: true };
  },
};

