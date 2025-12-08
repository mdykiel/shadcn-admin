import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateUnitInput, UpdateUnitInput } from '../validators/units.validator.js';

export const unitsService = {
  async getAll(userId: string) {
    const userUnits = await prisma.userUnit.findMany({
      where: { userId },
      include: {
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return userUnits.map((membership) => ({
      ...membership.unit,
      userRole: membership.role,
      isUserOwner: membership.isOwner,
    }));
  },

  async getById(unitId: string, userId: string) {
    const userUnit = await prisma.userUnit.findUnique({
      where: {
        userId_unitId: { userId, unitId },
      },
      include: {
        unit: true,
      },
    });

    if (!userUnit) {
      throw new AppError('Jednostka nie znaleziona lub brak dostępu', 404);
    }

    return {
      ...userUnit.unit,
      userRole: userUnit.role,
      isUserOwner: userUnit.isOwner,
    };
  },

  async create(userId: string, data: CreateUnitInput) {
    // Create unit and user membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      const unit = await tx.budgetUnit.create({
        data: {
          name: data.name,
          shortName: data.shortName,
          regon: data.regon,
          nip: data.nip,
          unitType: data.unitType,
          defaultDzial: data.defaultDzial,
          defaultRozdzial: data.defaultRozdzial,
          fiscalYearStart: data.fiscalYearStart,
        },
      });

      // Create owner membership
      await tx.userUnit.create({
        data: {
          userId,
          unitId: unit.id,
          role: 'OWNER',
          isOwner: true,
        },
      });

      // Create default journals if requested
      if (data.createDefaultJournals !== false) {
        await tx.journal.createMany({
          data: [
            {
              unitId: unit.id,
              name: 'Budżet',
              shortName: 'BUD',
              type: 'BUDZET',
              requiresClassification: true,
              hasOwnAccountPlan: true,
              hasFinancialPlan: true,
              isDefault: true,
              isActive: true,
            },
            {
              unitId: unit.id,
              name: 'Wydzielony Rachunek Dochodów',
              shortName: 'WRD',
              type: 'WRD',
              requiresClassification: true,
              hasOwnAccountPlan: true,
              hasFinancialPlan: true,
              isDefault: false,
              isActive: true,
            },
            {
              unitId: unit.id,
              name: 'Zakładowy Fundusz Świadczeń Socjalnych',
              shortName: 'ZFŚS',
              type: 'ZFSS',
              requiresClassification: false,
              hasOwnAccountPlan: true,
              hasFinancialPlan: false,
              isDefault: false,
              isActive: true,
            },
          ],
        });
      }

      return unit;
    });

    return { ...result, userRole: 'OWNER', isUserOwner: true };
  },

  async update(unitId: string, userId: string, data: UpdateUnitInput) {
    // Check access
    const userUnit = await prisma.userUnit.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });

    if (!userUnit) {
      throw new AppError('Jednostka nie znaleziona lub brak dostępu', 404);
    }

    if (userUnit.role === 'VIEWER') {
      throw new AppError('Brak uprawnień do edycji', 403);
    }

    const unit = await prisma.budgetUnit.update({
      where: { id: unitId },
      data,
    });

    return { ...unit, userRole: userUnit.role, isUserOwner: userUnit.isOwner };
  },

  async delete(unitId: string, userId: string) {
    const userUnit = await prisma.userUnit.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });

    if (!userUnit || !userUnit.isOwner) {
      throw new AppError('Tylko właściciel może usunąć jednostkę', 403);
    }

    await prisma.budgetUnit.delete({ where: { id: unitId } });
    return { message: 'Jednostka została usunięta' };
  },
};

