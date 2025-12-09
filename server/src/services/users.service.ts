import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import bcrypt from 'bcryptjs';

export const usersService = {
  // Pobierz wszystkich użytkowników jednostki
  async getByUnit(unitId: string) {
    const userUnits = await prisma.userUnit.findMany({
      where: { unitId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            isSystemAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Pobierz role użytkowników w tej jednostce
    const userIds = userUnits.map(uu => uu.userId);
    const userRoles = await prisma.userRole.findMany({
      where: { 
        userId: { in: userIds },
        unitId,
      },
      include: {
        role: true,
      },
    });

    const userRolesMap = new Map<string, typeof userRoles>();
    for (const ur of userRoles) {
      if (!userRolesMap.has(ur.userId)) {
        userRolesMap.set(ur.userId, []);
      }
      userRolesMap.get(ur.userId)!.push(ur);
    }

    return userUnits.map(uu => ({
      ...uu.user,
      unitRole: uu.role,
      isOwner: uu.isOwner,
      roles: (userRolesMap.get(uu.userId) || []).map(ur => ur.role),
    }));
  },

  // Pobierz pojedynczego użytkownika
  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        isSystemAdmin: true,
        createdAt: true,
        updatedAt: true,
        roleAssignments: {
          include: { role: true },
        },
        unitMemberships: {
          include: { unit: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404);
    }

    return user;
  },

  // Utwórz nowego użytkownika i dodaj do jednostki
  async create(unitId: string, data: {
    email: string;
    password?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleIds?: string[];
    roleAssignments?: Array<{
      roleId: string;
      journalId?: string | null;
      fiscalPeriodId?: string | null;
    }>;
  }) {
    // Sprawdź czy email istnieje
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('Użytkownik z tym adresem email już istnieje', 400);
    }

    // Generuj losowe hasło jeśli nie podano
    const password = data.password || Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      // Utwórz użytkownika
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          status: 'INVITED',
        },
      });

      // Dodaj do jednostki
      await tx.userUnit.create({
        data: {
          userId: newUser.id,
          unitId,
          role: 'MEMBER',
          isOwner: false,
        },
      });

      // Przypisz role z zakresami
      if (data.roleAssignments && data.roleAssignments.length > 0) {
        await tx.userRole.createMany({
          data: data.roleAssignments.map(ra => ({
            userId: newUser.id,
            roleId: ra.roleId,
            unitId,
            journalId: ra.journalId || null,
            fiscalPeriodId: ra.fiscalPeriodId || null,
          })),
        });
      } else if (data.roleIds && data.roleIds.length > 0) {
        // Fallback: stara wersja - role bez zakresów
        await tx.userRole.createMany({
          data: data.roleIds.map(roleId => ({
            userId: newUser.id,
            roleId,
            unitId,
            journalId: null,
            fiscalPeriodId: null,
          })),
        });
      }

      return newUser;
    });

    return { ...user, generatedPassword: data.password ? undefined : password };
  },

  // Aktualizuj użytkownika
  async update(userId: string, unitId: string, data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED';
    roleIds?: string[];
  }) {
    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          status: data.status,
        },
      });

      // Aktualizuj role jeśli podano
      if (data.roleIds !== undefined) {
        // Usuń istniejące role w tej jednostce
        await tx.userRole.deleteMany({
          where: { userId, unitId },
        });

        // Dodaj nowe role
        if (data.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: data.roleIds.map(roleId => ({
              userId,
              roleId,
              unitId,
            })),
          });
        }
      }

      return updated;
    });

    return user;
  },

  // Usuń użytkownika z jednostki
  async removeFromUnit(userId: string, unitId: string) {
    // Sprawdź czy użytkownik jest właścicielem
    const membership = await prisma.userUnit.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });

    if (!membership) {
      throw new AppError('Użytkownik nie jest członkiem tej jednostki', 404);
    }

    if (membership.isOwner) {
      throw new AppError('Nie można usunąć właściciela jednostki', 400);
    }

    await prisma.$transaction([
      // Usuń przypisania ról
      prisma.userRole.deleteMany({
        where: { userId, unitId },
      }),
      // Usuń członkostwo
      prisma.userUnit.delete({
        where: { userId_unitId: { userId, unitId } },
      }),
    ]);

    return { success: true };
  },

  // Zmień status użytkownika
  async updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED') {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  },

  // Zresetuj hasło
  async resetPassword(userId: string, newPassword?: string) {
    const password = newPassword || Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { generatedPassword: newPassword ? undefined : password };
  },

  // Przypisz role do użytkownika
  async assignRoles(userId: string, unitId: string, roleIds: string[]) {
    await prisma.$transaction([
      // Usuń istniejące role w tej jednostce
      prisma.userRole.deleteMany({
        where: { userId, unitId },
      }),
      // Dodaj nowe
      prisma.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          unitId,
        })),
      }),
    ]);

    return { success: true };
  },
};

