import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.pl' },
    update: {},
    create: {
      email: 'admin@test.pl',
      password: hashedPassword,
      name: 'Administrator',
    },
  });
  console.log('✅ Created user:', user.email);

  // Create budget unit
  const unit = await prisma.budgetUnit.upsert({
    where: { id: 'seed-unit-1' },
    update: {},
    create: {
      id: 'seed-unit-1',
      name: 'Szkoła Podstawowa nr 5 w Krakowie',
      shortName: 'SP5',
      regon: '123456789',
      nip: '123-456-78-90',
      unitType: 'JEDNOSTKA_BUDZETOWA',
      defaultDzial: '801',
      defaultRozdzial: '80101',
      fiscalYearStart: 1,
    },
  });
  console.log('✅ Created budget unit:', unit.name);

  // Create user-unit membership
  await prisma.userUnit.upsert({
    where: { userId_unitId: { userId: user.id, unitId: unit.id } },
    update: {},
    create: {
      userId: user.id,
      unitId: unit.id,
      role: 'OWNER',
      isOwner: true,
    },
  });
  console.log('✅ Created user-unit membership');

  // Create default journals
  const budzetJournal = await prisma.journal.upsert({
    where: { id: 'seed-journal-budzet' },
    update: {},
    create: {
      id: 'seed-journal-budzet',
      unitId: unit.id,
      name: 'Budżet',
      shortName: 'BUD',
      type: 'BUDZET',
      description: 'Główny dziennik budżetowy jednostki',
      requiresClassification: true,
      hasOwnAccountPlan: true,
      hasFinancialPlan: true,
      isDefault: true,
      isActive: true,
    },
  });

  const wrdJournal = await prisma.journal.upsert({
    where: { id: 'seed-journal-wrd' },
    update: {},
    create: {
      id: 'seed-journal-wrd',
      unitId: unit.id,
      name: 'Wydzielony Rachunek Dochodów',
      shortName: 'WRD',
      type: 'WRD',
      description: 'Dziennik wydzielonego rachunku dochodów',
      requiresClassification: true,
      hasOwnAccountPlan: true,
      hasFinancialPlan: true,
      isDefault: false,
      isActive: true,
    },
  });

  const zfssJournal = await prisma.journal.upsert({
    where: { id: 'seed-journal-zfss' },
    update: {},
    create: {
      id: 'seed-journal-zfss',
      unitId: unit.id,
      name: 'Zakładowy Fundusz Świadczeń Socjalnych',
      shortName: 'ZFŚS',
      type: 'ZFSS',
      description: 'Dziennik Zakładowego Funduszu Świadczeń Socjalnych',
      requiresClassification: false,
      hasOwnAccountPlan: true,
      hasFinancialPlan: false,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('✅ Created journals: Budżet, WRD, ZFŚS');

  // Create fiscal period for 2025
  const fiscalPeriod2025 = await prisma.fiscalPeriod.upsert({
    where: { unitId_name: { unitId: unit.id, name: 'Rok 2025' } },
    update: { isActive: true },
    create: {
      unitId: unit.id,
      name: 'Rok 2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isClosed: false,
      isActive: true,
    },
  });
  console.log('✅ Created fiscal period: Rok 2025');

  // Create sample accounts for Budżet journal
  const accounts = [
    { number: '011', name: 'Środki trwałe', zespol: 0, syntetyczne: '011', accountType: 'BILANSOWE_AKTYWNE', normalBalance: 'DEBIT' },
    { number: '013', name: 'Pozostałe środki trwałe', zespol: 0, syntetyczne: '013', accountType: 'BILANSOWE_AKTYWNE', normalBalance: 'DEBIT' },
    { number: '101', name: 'Kasa', zespol: 1, syntetyczne: '101', accountType: 'BILANSOWE_AKTYWNE', normalBalance: 'DEBIT' },
    { number: '130', name: 'Rachunek bieżący jednostki', zespol: 1, syntetyczne: '130', accountType: 'BILANSOWE_AKTYWNE', normalBalance: 'DEBIT' },
    { number: '201', name: 'Rozrachunki z odbiorcami i dostawcami', zespol: 2, syntetyczne: '201', accountType: 'BILANSOWE_AKTYWNO_PASYWNE', normalBalance: 'DEBIT' },
    { number: '231', name: 'Rozrachunki z tytułu wynagrodzeń', zespol: 2, syntetyczne: '231', accountType: 'BILANSOWE_PASYWNE', normalBalance: 'CREDIT' },
    { number: '400', name: 'Amortyzacja', zespol: 4, syntetyczne: '400', accountType: 'WYNIKOWE_KOSZTOWE', normalBalance: 'DEBIT' },
    { number: '401', name: 'Zużycie materiałów i energii', zespol: 4, syntetyczne: '401', accountType: 'WYNIKOWE_KOSZTOWE', normalBalance: 'DEBIT' },
    { number: '404', name: 'Wynagrodzenia', zespol: 4, syntetyczne: '404', accountType: 'WYNIKOWE_KOSZTOWE', normalBalance: 'DEBIT' },
    { number: '720', name: 'Przychody z tytułu dochodów budżetowych', zespol: 7, syntetyczne: '720', accountType: 'WYNIKOWE_PRZYCHODOWE', normalBalance: 'CREDIT' },
    { number: '800', name: 'Fundusz jednostki', zespol: 8, syntetyczne: '800', accountType: 'BILANSOWE_PASYWNE', normalBalance: 'CREDIT' },
    { number: '860', name: 'Wynik finansowy', zespol: 8, syntetyczne: '860', accountType: 'BILANSOWE_PASYWNE', normalBalance: 'CREDIT' },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { unitId_journalId_fiscalPeriodId_number: { unitId: unit.id, journalId: budzetJournal.id, fiscalPeriodId: fiscalPeriod2025.id, number: acc.number } },
      update: {},
      create: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        fiscalPeriodId: fiscalPeriod2025.id,
        ...acc,
        isActive: true,
      } as any,
    });
  }
  console.log('✅ Created', accounts.length, 'sample accounts for fiscal period 2025');

  // Create sample budget classifications
  const classifications = [
    { dzial: '801', rozdzial: '80101', paragraf: '4010', name: 'Wynagrodzenia osobowe pracowników', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4110', name: 'Składki na ubezpieczenia społeczne', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4210', name: 'Zakup materiałów i wyposażenia', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4300', name: 'Zakup usług pozostałych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '0830', name: 'Wpływy z usług', type: 'DOCHOD' },
  ];

  for (const cls of classifications) {
    // Check if classification already exists
    const existing = await prisma.budgetClassification.findFirst({
      where: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        dzial: cls.dzial,
        rozdzial: cls.rozdzial,
        paragraf: cls.paragraf,
        podparagraf: null,
      },
    });

    if (!existing) {
      await prisma.budgetClassification.create({
        data: {
          unitId: unit.id,
          journalId: budzetJournal.id,
          ...cls,
          isActive: true,
        } as any,
      });
    }
  }
  console.log('✅ Created', classifications.length, 'sample classifications');

  // Create sample operations (journal entries)
  // First get account IDs
  const konto130 = await prisma.account.findFirst({ where: { unitId: unit.id, number: '130' } });
  const konto201 = await prisma.account.findFirst({ where: { unitId: unit.id, number: '201' } });
  const konto401 = await prisma.account.findFirst({ where: { unitId: unit.id, number: '401' } });
  const konto404 = await prisma.account.findFirst({ where: { unitId: unit.id, number: '404' } });
  const konto231 = await prisma.account.findFirst({ where: { unitId: unit.id, number: '231' } });

  // Get classification for wydatek 4210
  const klasyfikacja4210 = await prisma.budgetClassification.findFirst({
    where: { unitId: unit.id, paragraf: '4210' }
  });
  const klasyfikacja4010 = await prisma.budgetClassification.findFirst({
    where: { unitId: unit.id, paragraf: '4010' }
  });

  if (konto130 && konto201 && konto401 && konto404 && konto231) {
    // Operation 1 - Faktura zakupu (wprowadzona)
    const op1 = await prisma.operation.create({
      data: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        fiscalPeriodId: fiscalPeriod2025.id,
        entryDate: new Date('2025-01-15'),
        bookingDate: new Date('2025-01-15'),
        dueDate: new Date('2025-01-30'),
        documentNumber: 'FZ/001/2025',
        documentType: 'FAKTURA_ZAKUP',
        description: 'Zakup materiałów biurowych - Biuromax Sp. z o.o.',
        contractorName: 'Biuromax Sp. z o.o.',
        contractorNip: '123-456-78-90',
        totalAmount: 1230.00,
        status: 'WPROWADZONE',
      },
    });

    // Add journal entry for op1
    await prisma.journalEntry.create({
      data: {
        operationId: op1.id,
        debitAccountId: konto401.id,
        creditAccountId: konto201.id,
        amount: 1230.00,
        classificationId: klasyfikacja4210?.id,
        description: 'Zakup materiałów biurowych',
      },
    });

    // Operation 2 - Wyciąg bankowy (zadekretowana)
    const op2 = await prisma.operation.create({
      data: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        fiscalPeriodId: fiscalPeriod2025.id,
        entryDate: new Date('2025-01-16'),
        bookingDate: new Date('2025-01-16'),
        documentNumber: 'WB/001/2025',
        documentType: 'WYCIAG_BANKOWY',
        description: 'Przelew za fakturę FZ/001/2025',
        contractorName: 'Biuromax Sp. z o.o.',
        totalAmount: 1230.00,
        status: 'ZADEKRETOWANE',
      },
    });

    await prisma.journalEntry.create({
      data: {
        operationId: op2.id,
        debitAccountId: konto201.id,
        creditAccountId: konto130.id,
        amount: 1230.00,
        classificationId: klasyfikacja4210?.id,
        description: 'Zapłata za materiały biurowe',
      },
    });

    // Operation 3 - Lista płac (zaksięgowana)
    const op3 = await prisma.operation.create({
      data: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        fiscalPeriodId: fiscalPeriod2025.id,
        entryDate: new Date('2025-01-31'),
        bookingDate: new Date('2025-01-31'),
        documentNumber: 'LP/001/2025',
        documentType: 'LISTA_PLAC',
        description: 'Lista płac za styczeń 2025',
        totalAmount: 45000.00,
        status: 'ZAKSIEGOWANE',
      },
    });

    await prisma.journalEntry.create({
      data: {
        operationId: op3.id,
        debitAccountId: konto404.id,
        creditAccountId: konto231.id,
        amount: 45000.00,
        classificationId: klasyfikacja4010?.id,
        description: 'Wynagrodzenia brutto za 01/2025',
      },
    });

    // Operation 4 - PK (wprowadzone) - bez dekretu do testu walidacji
    await prisma.operation.create({
      data: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        fiscalPeriodId: fiscalPeriod2025.id,
        entryDate: new Date('2025-02-01'),
        bookingDate: new Date('2025-02-01'),
        documentNumber: 'PK/001/2025',
        documentType: 'PK',
        description: 'Polecenie księgowania - korekta (wymaga dekretacji)',
        totalAmount: 150.00,
        status: 'WPROWADZONE',
      },
    });

    console.log('✅ Created 4 sample operations with journal entries');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

