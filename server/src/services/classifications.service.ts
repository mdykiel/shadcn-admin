import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateClassificationInput, UpdateClassificationInput } from '../validators/classifications.validator.js';

export const classificationsService = {
  async getAll(unitId: string, journalId?: string, type?: string) {
    const where: any = { unitId };
    if (journalId) where.journalId = journalId;
    if (type) where.type = type;

    return prisma.budgetClassification.findMany({
      where,
      orderBy: [{ dzial: 'asc' }, { rozdzial: 'asc' }, { paragraf: 'asc' }, { podparagraf: 'asc' }],
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });
  },

  async getTree(unitId: string, journalId?: string) {
    const where: any = { unitId };
    if (journalId) where.journalId = journalId;

    const classifications = await prisma.budgetClassification.findMany({
      where,
      orderBy: [{ dzial: 'asc' }, { rozdzial: 'asc' }, { paragraf: 'asc' }, { podparagraf: 'asc' }],
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });

    return classifications;
  },

  async getById(id: string, unitId: string) {
    const classification = await prisma.budgetClassification.findFirst({
      where: { id, unitId },
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!classification) {
      throw new AppError('Klasyfikacja nie znaleziona', 404);
    }

    return classification;
  },

  async create(data: CreateClassificationInput) {
    // Check uniqueness
    const existing = await prisma.budgetClassification.findFirst({
      where: {
        unitId: data.unitId,
        journalId: data.journalId,
        dzial: data.dzial,
        rozdzial: data.rozdzial,
        paragraf: data.paragraf,
        podparagraf: data.podparagraf || null,
      },
    });

    if (existing) {
      throw new AppError('Taka klasyfikacja już istnieje w tym dzienniku', 400);
    }

    // Verify journal belongs to unit and requires classification
    const journal = await prisma.journal.findFirst({
      where: { id: data.journalId, unitId: data.unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie należy do tej jednostki', 400);
    }

    if (!journal.requiresClassification) {
      throw new AppError('Ten dziennik nie wymaga klasyfikacji budżetowej', 400);
    }

    return prisma.budgetClassification.create({
      data: {
        unitId: data.unitId,
        journalId: data.journalId,
        dzial: data.dzial,
        rozdzial: data.rozdzial,
        paragraf: data.paragraf,
        podparagraf: data.podparagraf,
        name: data.name,
        type: data.type,
        isActive: true,
      },
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });
  },

  async update(id: string, unitId: string, data: UpdateClassificationInput) {
    const classification = await prisma.budgetClassification.findFirst({
      where: { id, unitId },
    });

    if (!classification) {
      throw new AppError('Klasyfikacja nie znaleziona', 404);
    }

    // Check uniqueness if changing key fields
    if (data.dzial || data.rozdzial || data.paragraf || data.podparagraf !== undefined) {
      const journalId = data.journalId || classification.journalId;
      const existing = await prisma.budgetClassification.findFirst({
        where: {
          unitId,
          journalId,
          dzial: data.dzial || classification.dzial,
          rozdzial: data.rozdzial || classification.rozdzial,
          paragraf: data.paragraf || classification.paragraf,
          podparagraf: data.podparagraf !== undefined ? data.podparagraf : classification.podparagraf,
          id: { not: id },
        },
      });
      if (existing) {
        throw new AppError('Taka klasyfikacja już istnieje w tym dzienniku', 400);
      }
    }

    return prisma.budgetClassification.update({
      where: { id },
      data,
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });
  },

  async delete(id: string, unitId: string) {
    const classification = await prisma.budgetClassification.findFirst({
      where: { id, unitId },
      include: { _count: { select: { planItems: true, journalEntries: true } } },
    });

    if (!classification) {
      throw new AppError('Klasyfikacja nie znaleziona', 404);
    }

    if (classification._count.planItems > 0 || classification._count.journalEntries > 0) {
      throw new AppError('Nie można usunąć klasyfikacji z przypisanymi danymi', 400);
    }

    await prisma.budgetClassification.delete({ where: { id } });
    return { message: 'Klasyfikacja została usunięta' };
  },

  async toggleActive(id: string, unitId: string) {
    const classification = await prisma.budgetClassification.findFirst({
      where: { id, unitId },
    });

    if (!classification) {
      throw new AppError('Klasyfikacja nie znaleziona', 404);
    }

    return prisma.budgetClassification.update({
      where: { id },
      data: { isActive: !classification.isActive },
    });
  },
};

