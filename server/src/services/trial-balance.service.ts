import prisma from '../utils/prisma.js'
import { Prisma } from '@prisma/client'

export interface TrialBalanceRow {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: string
  normalBalance: string
  // Bilans otwarcia (z dokumentów BO)
  boDebit: number
  boCredit: number
  // Obroty w okresie (bez BO)
  turnoverDebit: number
  turnoverCredit: number
  // Obroty narastająco (od początku roku, bez BO)
  cumulativeDebit: number
  cumulativeCredit: number
  // Saldo końcowe
  endingBalanceDebit: number
  endingBalanceCredit: number
}

export interface TrialBalanceParams {
  unitId: string
  fiscalPeriodId?: string
  journalId?: string
  status?: 'ZADEKRETOWANE' | 'ZAKSIEGOWANE'
  dateFrom?: Date
  dateTo?: Date
}

export const trialBalanceService = {
  async getTrialBalance(params: TrialBalanceParams): Promise<TrialBalanceRow[]> {
    const { unitId, fiscalPeriodId, journalId, status, dateFrom, dateTo } = params

    // Pobierz okres obrachunkowy jeśli podany, w przeciwnym razie aktywny
    let fiscalPeriod = null
    if (fiscalPeriodId) {
      fiscalPeriod = await prisma.fiscalPeriod.findUnique({ where: { id: fiscalPeriodId } })
    } else {
      fiscalPeriod = await prisma.fiscalPeriod.findFirst({ where: { unitId, isActive: true } })
    }

    // Domyślne daty na podstawie okresu obrachunkowego
    const effectiveYearStart = fiscalPeriod?.startDate || new Date(new Date().getFullYear(), 0, 1)
    const effectiveDateTo = dateTo || fiscalPeriod?.endDate || new Date()
    const effectiveDateFrom = dateFrom || effectiveYearStart

    // Pobierz wszystkie aktywne konta dla jednostki
    const accountsWhere: any = { unitId, isActive: true }
    if (journalId) {
      accountsWhere.journalId = journalId
    }

    const accounts = await prisma.account.findMany({
      where: accountsWhere,
      orderBy: [{ zespol: 'asc' }, { number: 'asc' }],
    })

    // Dla każdego konta oblicz sumy
    const results: TrialBalanceRow[] = []

    // Filtr statusu - domyślnie tylko zaksięgowane, ale można wybrać też zadekretowane lub oba
    const statusFilter = status
      ? { status: status as const }
      : { status: { in: ['ZADEKRETOWANE', 'ZAKSIEGOWANE'] as const } }

    for (const account of accounts) {
      // Bazowy filtr dla wpisów
      const baseEntryFilter = {
        operation: {
          unitId,
          ...statusFilter,
          ...(journalId && { journalId }),
        },
      }

      // 1. Bilans otwarcia (dokumenty typu BO)
      const boEntries = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: {
            ...baseEntryFilter.operation,
            documentType: 'BO',
          },
          OR: [{ debitAccountId: account.id }, { creditAccountId: account.id }],
        },
        _sum: { amount: true },
      })

      // Osobno dla WN i MA w BO
      const boDebitSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: { ...baseEntryFilter.operation, documentType: 'BO' },
          debitAccountId: account.id,
        },
        _sum: { amount: true },
      })

      const boCreditSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: { ...baseEntryFilter.operation, documentType: 'BO' },
          creditAccountId: account.id,
        },
        _sum: { amount: true },
      })

      // 2. Obroty w okresie (bez BO)
      const turnoverDebitSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: {
            ...baseEntryFilter.operation,
            documentType: { not: 'BO' },
            bookingDate: { gte: effectiveDateFrom, lte: effectiveDateTo },
          },
          debitAccountId: account.id,
        },
        _sum: { amount: true },
      })

      const turnoverCreditSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: {
            ...baseEntryFilter.operation,
            documentType: { not: 'BO' },
            bookingDate: { gte: effectiveDateFrom, lte: effectiveDateTo },
          },
          creditAccountId: account.id,
        },
        _sum: { amount: true },
      })

      // 3. Obroty narastająco (od początku roku, bez BO)
      const cumulativeDebitSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: {
            ...baseEntryFilter.operation,
            documentType: { not: 'BO' },
            bookingDate: { gte: effectiveYearStart, lte: effectiveDateTo },
          },
          debitAccountId: account.id,
        },
        _sum: { amount: true },
      })

      const cumulativeCreditSum = await prisma.journalEntry.aggregate({
        where: {
          ...baseEntryFilter,
          operation: {
            ...baseEntryFilter.operation,
            documentType: { not: 'BO' },
            bookingDate: { gte: effectiveYearStart, lte: effectiveDateTo },
          },
          creditAccountId: account.id,
        },
        _sum: { amount: true },
      })

      // Oblicz wartości
      const boDebit = Number(boDebitSum._sum.amount || 0)
      const boCredit = Number(boCreditSum._sum.amount || 0)
      const turnoverDebit = Number(turnoverDebitSum._sum.amount || 0)
      const turnoverCredit = Number(turnoverCreditSum._sum.amount || 0)
      const cumulativeDebit = Number(cumulativeDebitSum._sum.amount || 0)
      const cumulativeCredit = Number(cumulativeCreditSum._sum.amount || 0)

      // Saldo końcowe = BO + Obroty narastająco
      const totalDebit = boDebit + cumulativeDebit
      const totalCredit = boCredit + cumulativeCredit
      const balance = totalDebit - totalCredit

      let endingBalanceDebit = 0
      let endingBalanceCredit = 0

      if (balance > 0) {
        endingBalanceDebit = balance
      } else if (balance < 0) {
        endingBalanceCredit = Math.abs(balance)
      }

      results.push({
        accountId: account.id,
        accountNumber: account.number,
        accountName: account.name,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        boDebit,
        boCredit,
        turnoverDebit,
        turnoverCredit,
        cumulativeDebit,
        cumulativeCredit,
        endingBalanceDebit,
        endingBalanceCredit,
      })
    }

    return results
  },
}

