import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateJournalInput, UpdateJournalInput } from '../validators/journals.validator.js';

export const journalsService = {
  async getAll(unitId: string, includeInactive = false) {
    const where: any = { unitId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.journal.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  },

  async getById(id: string, unitId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id, unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie znaleziony', 404);
    }

    return journal;
  },

  async getDefault(unitId: string) {
    const journal = await prisma.journal.findFirst({
      where: { unitId, isDefault: true, isActive: true },
    });

    return journal;
  },

  async create(data: CreateJournalInput) {
    // Check if shortName is unique within unit
    const existing = await prisma.journal.findFirst({
      where: { unitId: data.unitId, shortName: data.shortName },
    });

    if (existing) {
      throw new AppError('Dziennik o tym skrócie już istnieje', 400);
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.journal.updateMany({
        where: { unitId: data.unitId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.journal.create({
      data: {
        unitId: data.unitId,
        name: data.name,
        shortName: data.shortName,
        type: data.type,
        description: data.description,
        requiresClassification: data.requiresClassification,
        hasOwnAccountPlan: data.hasOwnAccountPlan,
        hasFinancialPlan: data.hasFinancialPlan,
        isDefault: data.isDefault,
        isActive: true,
      },
    });
  },

  async update(id: string, unitId: string, data: UpdateJournalInput) {
    const journal = await prisma.journal.findFirst({
      where: { id, unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie znaleziony', 404);
    }

    // Check shortName uniqueness if changing
    if (data.shortName && data.shortName !== journal.shortName) {
      const existing = await prisma.journal.findFirst({
        where: { unitId, shortName: data.shortName, id: { not: id } },
      });
      if (existing) {
        throw new AppError('Dziennik o tym skrócie już istnieje', 400);
      }
    }

    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.journal.updateMany({
        where: { unitId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.journal.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, unitId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id, unitId },
      include: {
        _count: {
          select: { accounts: true, budgetClassifications: true },
        },
      },
    });

    if (!journal) {
      throw new AppError('Dziennik nie znaleziony', 404);
    }

    // Check if has related data
    if (journal._count.accounts > 0 || journal._count.budgetClassifications > 0) {
      throw new AppError('Nie można usunąć dziennika z przypisanymi kontami lub klasyfikacją', 400);
    }

    await prisma.journal.delete({ where: { id } });
    return { message: 'Dziennik został usunięty' };
  },

  async toggleActive(id: string, unitId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id, unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie znaleziony', 404);
    }

    return prisma.journal.update({
      where: { id },
      data: { isActive: !journal.isActive },
    });
  },
};

