import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateAccountInput, UpdateAccountInput } from '../validators/accounts.validator.js';
import { getAccountTemplateForUnitType, type UnitType } from '../data/account-templates.js';

export const accountsService = {
  async getAll(unitId: string, journalId?: string, fiscalPeriodId?: string) {
    const where: any = { unitId };
    if (journalId) {
      where.journalId = journalId;
    }
    if (fiscalPeriodId) {
      where.fiscalPeriodId = fiscalPeriodId;
    }

    return prisma.account.findMany({
      where,
      orderBy: [{ zespol: 'asc' }, { number: 'asc' }],
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
        fiscalPeriod: { select: { id: true, name: true } },
      },
    });
  },

  async getTree(unitId: string, journalId?: string, fiscalPeriodId?: string) {
    const where: any = { unitId, parentId: null };
    if (journalId) {
      where.journalId = journalId;
    }
    if (fiscalPeriodId) {
      where.fiscalPeriodId = fiscalPeriodId;
    }

    const rootAccounts = await prisma.account.findMany({
      where,
      orderBy: [{ zespol: 'asc' }, { number: 'asc' }],
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
        fiscalPeriod: { select: { id: true, name: true } },
        children: {
          orderBy: { number: 'asc' },
          include: {
            children: {
              orderBy: { number: 'asc' },
            },
          },
        },
      },
    });

    return rootAccounts;
  },

  async getById(id: string, unitId: string) {
    const account = await prisma.account.findFirst({
      where: { id, unitId },
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
        parent: { select: { id: true, number: true, name: true } },
        children: { select: { id: true, number: true, name: true } },
      },
    });

    if (!account) {
      throw new AppError('Konto nie znalezione', 404);
    }

    return account;
  },

  async create(data: CreateAccountInput) {
    // Check if number is unique within unit and journal
    const existing = await prisma.account.findFirst({
      where: { unitId: data.unitId, journalId: data.journalId, number: data.number },
    });

    if (existing) {
      throw new AppError('Konto o tym numerze już istnieje w tym dzienniku', 400);
    }

    // Verify journal belongs to unit
    const journal = await prisma.journal.findFirst({
      where: { id: data.journalId, unitId: data.unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie należy do tej jednostki', 400);
    }

    return prisma.account.create({
      data: {
        unitId: data.unitId,
        journalId: data.journalId,
        fiscalPeriodId: data.fiscalPeriodId,
        number: data.number,
        name: data.name,
        zespol: data.zespol,
        syntetyczne: data.syntetyczne,
        analitpierwsze: data.analitpierwsze,
        analitdrugie: data.analitdrugie,
        accountType: data.accountType,
        normalBalance: data.normalBalance,
        description: data.description,
        parentId: data.parentId,
        isActive: true,
      },
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });
  },

  async update(id: string, unitId: string, data: UpdateAccountInput) {
    const account = await prisma.account.findFirst({ where: { id, unitId } });

    if (!account) {
      throw new AppError('Konto nie znalezione', 404);
    }

    // Check number uniqueness if changing
    if (data.number && data.number !== account.number) {
      const journalId = data.journalId || account.journalId;
      const existing = await prisma.account.findFirst({
        where: { unitId, journalId, number: data.number, id: { not: id } },
      });
      if (existing) {
        throw new AppError('Konto o tym numerze już istnieje w tym dzienniku', 400);
      }
    }

    return prisma.account.update({
      where: { id },
      data,
      include: {
        journal: { select: { id: true, name: true, shortName: true } },
      },
    });
  },

  async delete(id: string, unitId: string) {
    const account = await prisma.account.findFirst({
      where: { id, unitId },
      include: { _count: { select: { children: true, debitEntries: true, creditEntries: true } } },
    });

    if (!account) {
      throw new AppError('Konto nie znalezione', 404);
    }

    if (account._count.children > 0) {
      throw new AppError('Nie można usunąć konta z kontami podrzędnymi', 400);
    }

    if (account._count.debitEntries > 0 || account._count.creditEntries > 0) {
      throw new AppError('Nie można usunąć konta z zapisami księgowymi', 400);
    }

    await prisma.account.delete({ where: { id } });
    return { message: 'Konto zostało usunięte' };
  },

  async deleteMany(ids: string[], unitId: string) {
    // Fetch all accounts to be deleted with their hierarchy info
    const accounts = await prisma.account.findMany({
      where: { id: { in: ids }, unitId },
      include: {
        _count: {
          select: {
            debitEntries: true,
            creditEntries: true,
            offBalanceDebitEntries: true,
            offBalanceCreditEntries: true,
          }
        }
      },
    });

    if (accounts.length === 0) {
      throw new AppError('Nie znaleziono kont do usunięcia', 404);
    }

    // Check for accounts with journal entries
    const accountsWithEntries = accounts.filter(
      a => a._count.debitEntries > 0 || a._count.creditEntries > 0 ||
           a._count.offBalanceDebitEntries > 0 || a._count.offBalanceCreditEntries > 0
    );

    if (accountsWithEntries.length > 0) {
      throw new AppError(
        `Nie można usunąć ${accountsWithEntries.length} kont z zapisami księgowymi`,
        400
      );
    }

    // Get all account IDs that are being deleted
    const idsToDelete = new Set(accounts.map(a => a.id));

    // Check for children that are NOT in the deletion set
    const accountsWithExternalChildren = await prisma.account.findMany({
      where: {
        parentId: { in: ids },
        id: { notIn: ids },
        unitId,
      },
    });

    if (accountsWithExternalChildren.length > 0) {
      throw new AppError(
        'Nie można usunąć kont - niektóre mają konta podrzędne które nie są zaznaczone do usunięcia',
        400
      );
    }

    // Sort accounts so children are deleted before parents
    // Accounts with no parent or parent not in deletion set come last
    const sortedAccounts = [...accounts].sort((a, b) => {
      const aParentInSet = a.parentId && idsToDelete.has(a.parentId);
      const bParentInSet = b.parentId && idsToDelete.has(b.parentId);

      // Children (accounts with parent in set) should come first
      if (aParentInSet && !bParentInSet) return -1;
      if (!aParentInSet && bParentInSet) return 1;

      // Sort by number length descending (more specific = child)
      return b.number.length - a.number.length;
    });

    // Delete in transaction, one by one in sorted order
    await prisma.$transaction(async (tx) => {
      for (const account of sortedAccounts) {
        await tx.account.delete({ where: { id: account.id } });
      }
    });

    return {
      message: `Usunięto ${accounts.length} kont`,
      count: accounts.length,
    };
  },

  async toggleActive(id: string, unitId: string) {
    const account = await prisma.account.findFirst({ where: { id, unitId } });

    if (!account) {
      throw new AppError('Konto nie znalezione', 404);
    }

    return prisma.account.update({
      where: { id },
      data: { isActive: !account.isActive },
    });
  },

  async copyToJournal(
    unitId: string,
    accountIds: string[],
    targetJournalId: string,
    targetFiscalPeriodId: string
  ) {
    // Verify target journal exists and belongs to the unit
    const targetJournal = await prisma.journal.findFirst({
      where: { id: targetJournalId, unitId },
    });

    if (!targetJournal) {
      throw new AppError('Dziennik docelowy nie znaleziony', 404);
    }

    // Verify target fiscal period exists and belongs to the unit
    const targetPeriod = await prisma.fiscalPeriod.findFirst({
      where: { id: targetFiscalPeriodId, unitId },
    });

    if (!targetPeriod) {
      throw new AppError('Okres obrachunkowy nie znaleziony', 404);
    }

    // Get accounts to copy
    const accountsToCopy = await prisma.account.findMany({
      where: { id: { in: accountIds }, unitId },
      orderBy: { number: 'asc' },
    });

    if (accountsToCopy.length === 0) {
      throw new AppError('Nie znaleziono kont do skopiowania', 404);
    }

    // Check for duplicates in target journal/period
    const existingAccounts = await prisma.account.findMany({
      where: {
        unitId,
        journalId: targetJournalId,
        fiscalPeriodId: targetFiscalPeriodId,
        number: { in: accountsToCopy.map(a => a.number) },
      },
      select: { number: true },
    });

    const existingNumbers = new Set(existingAccounts.map(a => a.number));
    const accountsToCreate = accountsToCopy.filter(a => !existingNumbers.has(a.number));

    if (accountsToCreate.length === 0) {
      throw new AppError('Wszystkie wybrane konta już istnieją w docelowym dzienniku i okresie', 400);
    }

    // Create copies in transaction
    const createdAccounts = await prisma.$transaction(async (tx) => {
      const created: any[] = [];

      for (const account of accountsToCreate) {
        const newAccount = await tx.account.create({
          data: {
            unitId,
            journalId: targetJournalId,
            fiscalPeriodId: targetFiscalPeriodId,
            number: account.number,
            name: account.name,
            zespol: account.zespol,
            syntetyczne: account.syntetyczne,
            analitpierwsze: account.analitpierwsze,
            analitdrugie: account.analitdrugie,
            accountType: account.accountType,
            normalBalance: account.normalBalance,
            isActive: account.isActive,
            description: account.description,
            // parentId is not copied - would need to be re-linked
          },
        });
        created.push(newAccount);
      }

      return created;
    });

    const skippedCount = accountsToCopy.length - createdAccounts.length;
    let message = `Skopiowano ${createdAccounts.length} kont do dziennika "${targetJournal.shortName}"`;
    if (skippedCount > 0) {
      message += ` (pominięto ${skippedCount} istniejących)`;
    }

    return {
      message,
      count: createdAccounts.length,
      skipped: skippedCount,
    };
  },

  async copyToFiscalPeriod(unitId: string, sourceFiscalPeriodId: string, targetFiscalPeriodId: string, journalId?: string) {
    // Verify both fiscal periods exist and belong to the unit
    const [sourcePeriod, targetPeriod] = await Promise.all([
      prisma.fiscalPeriod.findFirst({ where: { id: sourceFiscalPeriodId, unitId } }),
      prisma.fiscalPeriod.findFirst({ where: { id: targetFiscalPeriodId, unitId } }),
    ]);

    if (!sourcePeriod) {
      throw new AppError('Okres źródłowy nie znaleziony', 404);
    }
    if (!targetPeriod) {
      throw new AppError('Okres docelowy nie znaleziony', 404);
    }

    // Get accounts from source period
    const whereSource: any = { unitId, fiscalPeriodId: sourceFiscalPeriodId };
    if (journalId) {
      whereSource.journalId = journalId;
    }

    const sourceAccounts = await prisma.account.findMany({
      where: whereSource,
      orderBy: [{ zespol: 'asc' }, { number: 'asc' }],
    });

    if (sourceAccounts.length === 0) {
      throw new AppError('Brak kont w okresie źródłowym do skopiowania', 400);
    }

    // Check for existing accounts in target period
    const whereTarget: any = { unitId, fiscalPeriodId: targetFiscalPeriodId };
    if (journalId) {
      whereTarget.journalId = journalId;
    }

    const existingInTarget = await prisma.account.count({ where: whereTarget });
    if (existingInTarget > 0) {
      throw new AppError(`W okresie docelowym już istnieje ${existingInTarget} kont. Usuń je przed kopiowaniem.`, 400);
    }

    // Create mapping of old IDs to new IDs for parent relationships
    const idMapping = new Map<string, string>();

    // First pass: create accounts without parent relationships
    const createdAccounts = await prisma.$transaction(async (tx) => {
      const created: any[] = [];

      // Sort accounts so parents come before children
      const sortedAccounts = [...sourceAccounts].sort((a, b) => {
        // Accounts without parent first
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return a.number.localeCompare(b.number);
      });

      for (const account of sortedAccounts) {
        const newAccount = await tx.account.create({
          data: {
            unitId: account.unitId,
            journalId: account.journalId,
            fiscalPeriodId: targetFiscalPeriodId,
            number: account.number,
            name: account.name,
            zespol: account.zespol,
            syntetyczne: account.syntetyczne,
            analitpierwsze: account.analitpierwsze,
            analitdrugie: account.analitdrugie,
            accountType: account.accountType,
            normalBalance: account.normalBalance,
            isActive: account.isActive,
            description: account.description,
            parentId: account.parentId ? idMapping.get(account.parentId) : null,
          },
        });

        idMapping.set(account.id, newAccount.id);
        created.push(newAccount);
      }

      return created;
    });

    return {
      message: `Skopiowano ${createdAccounts.length} kont z okresu "${sourcePeriod.name}" do "${targetPeriod.name}"`,
      count: createdAccounts.length,
    };
  },

  async initializeFromTemplate(
    unitId: string,
    journalId: string,
    fiscalPeriodId: string,
    unitType: UnitType
  ) {
    // Verify journal belongs to unit
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, unitId },
    });

    if (!journal) {
      throw new AppError('Dziennik nie należy do tej jednostki', 400);
    }

    // Verify fiscal period belongs to unit
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: { id: fiscalPeriodId, unitId },
    });

    if (!fiscalPeriod) {
      throw new AppError('Okres obrachunkowy nie należy do tej jednostki', 400);
    }

    // Check if accounts already exist for this journal and period
    const existingCount = await prisma.account.count({
      where: { unitId, journalId, fiscalPeriodId },
    });

    if (existingCount > 0) {
      throw new AppError(
        `W tym dzienniku i okresie już istnieje ${existingCount} kont. Usuń je przed inicjalizacją.`,
        400
      );
    }

    // Get template accounts for the unit type
    const templateAccounts = getAccountTemplateForUnitType(unitType);

    // Create accounts from template
    const createdAccounts = await prisma.$transaction(async (tx) => {
      const created: any[] = [];

      for (const template of templateAccounts) {
        // Determine account type based on zespol number
        let accountType: 'BILANSOWE_AKTYWNE' | 'BILANSOWE_PASYWNE' | 'WYNIKOWE_KOSZTOWE' | 'WYNIKOWE_PRZYCHODOWE' | 'POZABILANSOWE' | 'ROZLICZENIOWE' = 'BILANSOWE_AKTYWNE';
        if (template.zespol === 0 || template.zespol === 1 || template.zespol === 3 || template.zespol === 6) {
          accountType = 'BILANSOWE_AKTYWNE';
        } else if (template.zespol === 2 || template.zespol === 8) {
          accountType = 'BILANSOWE_PASYWNE';
        } else if (template.zespol === 4 || template.zespol === 5) {
          accountType = 'WYNIKOWE_KOSZTOWE';
        } else if (template.zespol === 7) {
          accountType = 'WYNIKOWE_PRZYCHODOWE';
        } else if (template.zespol === 9) {
          accountType = 'POZABILANSOWE';
        }

        const newAccount = await tx.account.create({
          data: {
            unitId,
            journalId,
            fiscalPeriodId,
            number: template.number,
            name: template.name,
            zespol: template.zespol,
            syntetyczne: template.isSynthetic ? template.number : '',
            accountType,
            normalBalance: template.zespol <= 3 || template.zespol === 6 ? 'DEBIT' : 'CREDIT',
            isActive: true,
            description: template.description,
          },
        });
        created.push(newAccount);
      }

      return created;
    });

    return {
      message: `Utworzono ${createdAccounts.length} kont z szablonu dla typu "${unitType}"`,
      count: createdAccounts.length,
      unitType,
    };
  },
};

