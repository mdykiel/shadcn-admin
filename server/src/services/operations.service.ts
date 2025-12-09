import prisma from '../utils/prisma.js'
import { OperationStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Helper to find fiscal period for a given date
async function findFiscalPeriodForDate(unitId: string, date: Date) {
  return prisma.fiscalPeriod.findFirst({
    where: {
      unitId,
      startDate: { lte: date },
      endDate: { gte: date },
      isClosed: false,
    },
  })
}

// Helper to validate operation can change status
async function validateStatusChange(operationId: string, newStatus: OperationStatus) {
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: {
      entries: true,
      fiscalPeriod: true,
    },
  })

  if (!operation) {
    throw new Error('Operacja nie istnieje')
  }

  // Check fiscal period for ZADEKRETOWANE and ZAKSIEGOWANE
  if (newStatus === 'ZADEKRETOWANE' || newStatus === 'ZAKSIEGOWANE') {
    // Validate bookingDate is set
    if (!operation.bookingDate) {
      throw new Error('Data księgowania jest wymagana. Uzupełnij datę księgowania przed dekretowaniem.')
    }

    const fiscalPeriod = await findFiscalPeriodForDate(operation.unitId, operation.bookingDate)

    if (!fiscalPeriod) {
      throw new Error('Data księgowania jest poza aktywnym okresem obrachunkowym. Zmień datę lub okres obrachunkowy.')
    }

    if (fiscalPeriod.isClosed) {
      throw new Error('Okres obrachunkowy jest zamknięty. Nie można zmieniać statusu operacji.')
    }

    // Check balance (Wn = Ma)
    let totalDebit = new Decimal(0)
    let totalCredit = new Decimal(0)

    for (const entry of operation.entries) {
      // Konwertuj amount do Decimal (może być string z Prisma)
      const amount = new Decimal(entry.amount.toString())

      if (entry.debitAccountId) {
        totalDebit = totalDebit.plus(amount)
      }
      if (entry.creditAccountId) {
        totalCredit = totalCredit.plus(amount)
      }
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new Error(`Dokument nie jest zbilansowany. Wn: ${totalDebit.toFixed(2)}, Ma: ${totalCredit.toFixed(2)}`)
    }

    // Dokument musi mieć przynajmniej jeden dekret
    if (operation.entries.length === 0) {
      throw new Error('Dokument nie ma żadnych dekretów')
    }

    return { operation, fiscalPeriod }
  }

  return { operation, fiscalPeriod: null }
}

export const operationsService = {
  async getAll(unitId: string, status?: OperationStatus, journalId?: string) {
    const where: any = { unitId }
    if (status) {
      where.status = status
    }
    if (journalId) {
      where.journalId = journalId
    }

    return prisma.operation.findMany({
      where,
      include: {
        journal: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
            offBalanceDebitAccount: true,
            offBalanceCreditAccount: true,
            classification: true,
          },
        },
      },
      orderBy: [
        { entryDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  },

  async getById(id: string) {
    return prisma.operation.findUnique({
      where: { id },
      include: {
        journal: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
            offBalanceDebitAccount: true,
            offBalanceCreditAccount: true,
            classification: true,
          },
        },
      },
    })
  },

  async create(unitId: string, data: {
    journalId: string
    entryDate?: Date
    bookingDate?: Date
    dueDate?: Date
    documentNumber: string
    documentType: string
    description: string
    contractorName?: string
    contractorNip?: string
    totalAmount: number
    entries?: Array<{
      debitAccountId?: string
      creditAccountId?: string
      offBalanceDebitAccountId?: string
      offBalanceCreditAccountId?: string
      classificationId?: string
      amount: number
      description?: string
    }>
  }) {
    return prisma.operation.create({
      data: {
        unitId,
        journalId: data.journalId,
        entryDate: data.entryDate || new Date(),
        bookingDate: data.bookingDate,
        dueDate: data.dueDate,
        documentNumber: data.documentNumber,
        documentType: data.documentType as any,
        description: data.description,
        contractorName: data.contractorName,
        contractorNip: data.contractorNip,
        totalAmount: data.totalAmount,
        status: 'WPROWADZONE',
        entries: data.entries ? {
          create: data.entries.map(entry => {
            // Budujemy obiekt tylko z niepustymi wartościami
            const entryData: any = {
              amount: entry.amount,
            }
            if (entry.debitAccountId) entryData.debitAccountId = entry.debitAccountId
            if (entry.creditAccountId) entryData.creditAccountId = entry.creditAccountId
            if (entry.offBalanceDebitAccountId) entryData.offBalanceDebitAccountId = entry.offBalanceDebitAccountId
            if (entry.offBalanceCreditAccountId) entryData.offBalanceCreditAccountId = entry.offBalanceCreditAccountId
            if (entry.classificationId) entryData.classificationId = entry.classificationId
            if (entry.description) entryData.description = entry.description
            return entryData
          }),
        } : undefined,
      },
      include: {
        journal: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
            offBalanceDebitAccount: true,
            offBalanceCreditAccount: true,
            classification: true,
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<{
    entryDate?: Date
    bookingDate?: Date
    dueDate?: Date
    documentNumber: string
    documentType: string
    description: string
    contractorName?: string
    contractorNip?: string
    totalAmount: number
    entries?: Array<{
      debitAccountId?: string
      creditAccountId?: string
      offBalanceDebitAccountId?: string
      offBalanceCreditAccountId?: string
      classificationId?: string
      amount: number
      description?: string
    }>
  }>) {
    const { entries, ...operationData } = data

    // Jeśli są entries, najpierw usuń stare i dodaj nowe
    if (entries && entries.length > 0) {
      // Usuń stare entries
      await prisma.journalEntry.deleteMany({
        where: { operationId: id }
      })

      // Przygotuj nowe entries
      const entriesCreate = entries.map(entry => {
        const entryData: any = {
          operationId: id,
          amount: entry.amount,
        }
        if (entry.debitAccountId) entryData.debitAccountId = entry.debitAccountId
        if (entry.creditAccountId) entryData.creditAccountId = entry.creditAccountId
        if (entry.offBalanceDebitAccountId) entryData.offBalanceDebitAccountId = entry.offBalanceDebitAccountId
        if (entry.offBalanceCreditAccountId) entryData.offBalanceCreditAccountId = entry.offBalanceCreditAccountId
        if (entry.classificationId) entryData.classificationId = entry.classificationId
        if (entry.description) entryData.description = entry.description
        return entryData
      })

      // Utwórz nowe entries
      await prisma.journalEntry.createMany({
        data: entriesCreate
      })
    }

    // Zaktualizuj operację
    return prisma.operation.update({
      where: { id },
      data: {
        ...operationData,
        documentType: operationData.documentType as any,
      },
      include: {
        journal: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
            offBalanceDebitAccount: true,
            offBalanceCreditAccount: true,
            classification: true,
          },
        },
      },
    })
  },

  async updateStatus(id: string, status: OperationStatus) {
    // Validate status change (throws error if invalid)
    const { fiscalPeriod } = await validateStatusChange(id, status)

    const updateData: any = { status }

    if (status === 'ZAKSIEGOWANE') {
      updateData.bookingDate = new Date()
    }

    // Assign fiscal period when decreeing or booking
    if ((status === 'ZADEKRETOWANE' || status === 'ZAKSIEGOWANE') && fiscalPeriod) {
      updateData.fiscalPeriodId = fiscalPeriod.id
    }

    return prisma.operation.update({
      where: { id },
      data: updateData,
      include: {
        journal: true,
        fiscalPeriod: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
            offBalanceDebitAccount: true,
            offBalanceCreditAccount: true,
            classification: true,
          },
        },
      },
    })
  },

  async delete(id: string) {
    return prisma.operation.delete({
      where: { id },
    })
  },

  // Journal Entries
  async addEntry(operationId: string, data: {
    debitAccountId?: string
    creditAccountId?: string
    amount: number
    offBalanceDebitAccountId?: string
    offBalanceCreditAccountId?: string
    classificationId?: string
    description?: string
  }) {
    // Budujemy obiekt tylko z niepustymi wartościami
    const entryData: any = {
      operationId,
      amount: data.amount,
    }
    if (data.debitAccountId) entryData.debitAccountId = data.debitAccountId
    if (data.creditAccountId) entryData.creditAccountId = data.creditAccountId
    if (data.offBalanceDebitAccountId) entryData.offBalanceDebitAccountId = data.offBalanceDebitAccountId
    if (data.offBalanceCreditAccountId) entryData.offBalanceCreditAccountId = data.offBalanceCreditAccountId
    if (data.classificationId) entryData.classificationId = data.classificationId
    if (data.description) entryData.description = data.description

    return prisma.journalEntry.create({
      data: entryData,
      include: {
        debitAccount: true,
        creditAccount: true,
        offBalanceDebitAccount: true,
        offBalanceCreditAccount: true,
        classification: true,
      },
    })
  },

  async updateEntry(id: string, data: Partial<{
    debitAccountId: string
    creditAccountId: string
    amount: number
    offBalanceDebitAccountId?: string
    offBalanceCreditAccountId?: string
    classificationId?: string
    description?: string
  }>) {
    return prisma.journalEntry.update({
      where: { id },
      data,
    })
  },

  async deleteEntry(id: string) {
    return prisma.journalEntry.delete({
      where: { id },
    })
  },
}

