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

  // Create default permissions
  const permissionsData = [
    // Moduł: accounts (Plan kont)
    { code: 'accounts.view', name: 'Przeglądanie planu kont', module: 'accounts' },
    { code: 'accounts.create', name: 'Tworzenie kont', module: 'accounts' },
    { code: 'accounts.edit', name: 'Edycja kont', module: 'accounts' },
    { code: 'accounts.delete', name: 'Usuwanie kont', module: 'accounts' },
    { code: 'accounts.initialize', name: 'Inicjalizacja z szablonu', module: 'accounts' },

    // Moduł: operations (Księgowania)
    { code: 'operations.view', name: 'Przeglądanie operacji', module: 'operations' },
    { code: 'operations.create', name: 'Tworzenie operacji', module: 'operations' },
    { code: 'operations.edit', name: 'Edycja operacji', module: 'operations' },
    { code: 'operations.delete', name: 'Usuwanie operacji', module: 'operations' },
    { code: 'operations.decree', name: 'Dekretowanie operacji', module: 'operations' },
    { code: 'operations.book', name: 'Księgowanie operacji', module: 'operations' },
    { code: 'operations.unbook', name: 'Odksięgowywanie operacji', module: 'operations' },
    { code: 'operations.approve', name: 'Zatwierdzanie operacji', module: 'operations' },

    // Moduł: reports (Sprawozdania)
    { code: 'reports.view', name: 'Przeglądanie sprawozdań', module: 'reports' },
    { code: 'reports.generate', name: 'Generowanie sprawozdań', module: 'reports' },
    { code: 'reports.export', name: 'Eksport sprawozdań', module: 'reports' },

    // Moduł: classification (Klasyfikacja budżetowa)
    { code: 'classification.view', name: 'Przeglądanie klasyfikacji', module: 'classification' },
    { code: 'classification.manage', name: 'Zarządzanie klasyfikacją', module: 'classification' },

    // Moduł: journals (Dzienniki)
    { code: 'journals.view', name: 'Przeglądanie dzienników', module: 'journals' },
    { code: 'journals.manage', name: 'Zarządzanie dziennikami', module: 'journals' },

    // Moduł: fiscal-periods (Okresy obrachunkowe)
    { code: 'fiscal-periods.view', name: 'Przeglądanie okresów', module: 'fiscal-periods' },
    { code: 'fiscal-periods.manage', name: 'Zarządzanie okresami', module: 'fiscal-periods' },
    { code: 'fiscal-periods.close', name: 'Zamykanie okresów', module: 'fiscal-periods' },
    { code: 'fiscal-periods.reopen', name: 'Otwieranie zamkniętych okresów', module: 'fiscal-periods' },

    // Moduł: users (Użytkownicy)
    { code: 'users.view', name: 'Przeglądanie użytkowników', module: 'users' },
    { code: 'users.invite', name: 'Zapraszanie użytkowników', module: 'users' },
    { code: 'users.manage', name: 'Zarządzanie użytkownikami', module: 'users' },
    { code: 'users.roles', name: 'Przypisywanie ról', module: 'users' },

    // Moduł: roles (Role i uprawnienia)
    { code: 'roles.view', name: 'Przeglądanie ról', module: 'roles' },
    { code: 'roles.manage', name: 'Zarządzanie rolami', module: 'roles' },

    // Moduł: settings (Ustawienia jednostki)
    { code: 'settings.view', name: 'Przeglądanie ustawień', module: 'settings' },
    { code: 'settings.manage', name: 'Zarządzanie ustawieniami', module: 'settings' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    });
  }
  console.log('✅ Created', permissionsData.length, 'permissions');

  // Create default system roles
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

  // Rola: Administrator
  const adminRole = await prisma.role.upsert({
    where: { unitId_code: { unitId: unit.id, code: 'ADMIN' } },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Administrator',
      code: 'ADMIN',
      description: 'Pełny dostęp do wszystkich funkcji jednostki',
      isSystem: true,
    },
  });

  // Przypisz wszystkie uprawnienia do roli Admin
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Rola: Księgowy
  const accountantRole = await prisma.role.upsert({
    where: { unitId_code: { unitId: unit.id, code: 'KSIEGOWY' } },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Księgowy',
      code: 'KSIEGOWY',
      description: 'Dostęp do księgowań i sprawozdań',
      isSystem: true,
    },
  });

  const accountantPermissions = [
    'accounts.view', 'accounts.create', 'accounts.edit',
    'operations.view', 'operations.create', 'operations.edit', 'operations.approve',
    'reports.view', 'reports.generate', 'reports.export',
    'classification.view',
    'journals.view',
    'fiscal-periods.view',
  ];
  for (const code of accountantPermissions) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: accountantRole.id, permissionId: permId } },
        update: {},
        create: { roleId: accountantRole.id, permissionId: permId },
      });
    }
  }

  // Rola: Przeglądający
  const viewerRole = await prisma.role.upsert({
    where: { unitId_code: { unitId: unit.id, code: 'PRZEGLADAJACY' } },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Przeglądający',
      code: 'PRZEGLADAJACY',
      description: 'Tylko odczyt danych',
      isSystem: true,
    },
  });

  const viewerPermissions = [
    'accounts.view', 'operations.view', 'reports.view',
    'classification.view', 'journals.view', 'fiscal-periods.view',
  ];
  for (const code of viewerPermissions) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: permId } },
        update: {},
        create: { roleId: viewerRole.id, permissionId: permId },
      });
    }
  }

  // Rola: Dekretujący (może dekretować ale nie księgować)
  const decreerRole = await prisma.role.upsert({
    where: { unitId_code: { unitId: unit.id, code: 'DECREER' } },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Dekretujący',
      code: 'DECREER',
      description: 'Może wprowadzać i dekretować operacje, ale nie księgować',
      isSystem: true,
    },
  });

  const decreerPermissions = [
    'accounts.view',
    'operations.view', 'operations.create', 'operations.edit', 'operations.decree',
    'reports.view',
    'classification.view',
    'journals.view',
    'fiscal-periods.view',
  ];
  for (const code of decreerPermissions) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: decreerRole.id, permissionId: permId } },
        update: {},
        create: { roleId: decreerRole.id, permissionId: permId },
      });
    }
  }

  // Rola: Skarbnik (może zamykać okresy)
  const treasurerRole = await prisma.role.upsert({
    where: { unitId_code: { unitId: unit.id, code: 'TREASURER' } },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Skarbnik',
      code: 'TREASURER',
      description: 'Pełne uprawnienia księgowe + zamykanie okresów',
      isSystem: true,
    },
  });

  const treasurerPermissions = [
    'accounts.view', 'accounts.create', 'accounts.edit',
    'operations.view', 'operations.create', 'operations.edit', 'operations.decree',
    'operations.book', 'operations.unbook', 'operations.approve',
    'reports.view', 'reports.generate', 'reports.export',
    'classification.view', 'classification.manage',
    'journals.view', 'journals.manage',
    'fiscal-periods.view', 'fiscal-periods.manage', 'fiscal-periods.close',
  ];
  for (const code of treasurerPermissions) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: treasurerRole.id, permissionId: permId } },
        update: {},
        create: { roleId: treasurerRole.id, permissionId: permId },
      });
    }
  }

  console.log('✅ Created default roles: Administrator, Księgowy, Dekretujący, Skarbnik, Przeglądający');

  // Assign Admin role to the test user
  const existingAdminRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id,
      unitId: unit.id,
      journalId: null,
      fiscalPeriodId: null,
    },
  });
  if (!existingAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        unitId: unit.id,
        journalId: null,
        fiscalPeriodId: null,
      },
    });
  }
  console.log('✅ Assigned Admin role to test user');

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

