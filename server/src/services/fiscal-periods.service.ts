import prisma from '../utils/prisma.js'
import { Prisma } from '@prisma/client'

export interface CreateFiscalPeriodData {
  unitId: string
  name: string
  startDate: Date
  endDate: Date
  isActive?: boolean
}

export interface UpdateFiscalPeriodData {
  name?: string
  startDate?: Date
  endDate?: Date
  isClosed?: boolean
  isActive?: boolean
}

export const fiscalPeriodService = {
  async getAll(unitId: string) {
    return prisma.fiscalPeriod.findMany({
      where: { unitId },
      orderBy: { startDate: 'desc' },
    })
  },

  async getById(id: string) {
    return prisma.fiscalPeriod.findUnique({
      where: { id },
    })
  },

  async getActive(unitId: string) {
    return prisma.fiscalPeriod.findFirst({
      where: { unitId, isActive: true },
    })
  },

  async create(data: CreateFiscalPeriodData) {
    // Jeśli nowy okres ma być aktywny, dezaktywuj pozostałe
    if (data.isActive) {
      await prisma.fiscalPeriod.updateMany({
        where: { unitId: data.unitId, isActive: true },
        data: { isActive: false },
      })
    }

    return prisma.fiscalPeriod.create({
      data: {
        unitId: data.unitId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? false,
      },
    })
  },

  async update(id: string, data: UpdateFiscalPeriodData) {
    const existing = await prisma.fiscalPeriod.findUnique({ where: { id } })
    if (!existing) throw new Error('Okres obrachunkowy nie istnieje')

    // Jeśli ustawiamy jako aktywny, dezaktywuj pozostałe
    if (data.isActive === true) {
      await prisma.fiscalPeriod.updateMany({
        where: { unitId: existing.unitId, isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    return prisma.fiscalPeriod.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    // Sprawdź czy nie ma powiązanych kont lub operacji
    const period = await prisma.fiscalPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            accounts: true,
            operations: true,
          },
        },
      },
    })

    if (!period) throw new Error('Okres obrachunkowy nie istnieje')

    if (period._count.accounts > 0 || period._count.operations > 0) {
      throw new Error(
        `Nie można usunąć okresu - istnieją powiązane konta (${period._count.accounts}) lub operacje (${period._count.operations})`
      )
    }

    return prisma.fiscalPeriod.delete({
      where: { id },
    })
  },

  async setActive(id: string) {
    const period = await prisma.fiscalPeriod.findUnique({ where: { id } })
    if (!period) throw new Error('Okres obrachunkowy nie istnieje')

    // Dezaktywuj wszystkie okresy jednostki
    await prisma.fiscalPeriod.updateMany({
      where: { unitId: period.unitId, isActive: true },
      data: { isActive: false },
    })

    // Aktywuj wybrany
    return prisma.fiscalPeriod.update({
      where: { id },
      data: { isActive: true },
    })
  },

  async close(id: string) {
    const period = await prisma.fiscalPeriod.findUnique({ where: { id } })
    if (!period) throw new Error('Okres obrachunkowy nie istnieje')

    return prisma.fiscalPeriod.update({
      where: { id },
      data: { isClosed: true, isActive: false },
    })
  },
}

