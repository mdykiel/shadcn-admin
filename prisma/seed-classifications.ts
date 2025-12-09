import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Czyszczenie planów finansowych...');

  // Najpierw usuń wszystkie powiązane dane planów
  await prisma.planChangeRequestDetail.deleteMany({});
  await prisma.planChangeRequest.deleteMany({});
  await prisma.planChange.deleteMany({});
  await prisma.financialPlanItem.deleteMany({});
  await prisma.financialPlan.deleteMany({});
  console.log('✅ Usunięto wszystkie plany finansowe');

  // Usuń istniejące klasyfikacje
  await prisma.budgetClassification.deleteMany({});
  console.log('✅ Usunięto istniejące klasyfikacje');

  // Pobierz jednostkę i dziennik Budżet
  const unit = await prisma.budgetUnit.findFirst();
  if (!unit) {
    throw new Error('Brak jednostki budżetowej!');
  }

  const budzetJournal = await prisma.journal.findFirst({
    where: { unitId: unit.id, type: 'BUDZET' },
  });
  if (!budzetJournal) {
    throw new Error('Brak dziennika budżetowego!');
  }

  console.log(`📊 Dodawanie klasyfikacji dla jednostki: ${unit.name}`);

  // Klasyfikacja budżetowa dla szkoły podstawowej (dział 801)
  const classifications = [
    // ============ DOCHODY ============
    // Rozdział 80101 - Szkoły podstawowe
    { dzial: '801', rozdzial: '80101', paragraf: '0750', name: 'Wpływy z najmu i dzierżawy składników majątkowych', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0830', name: 'Wpływy z usług', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0870', name: 'Wpływy ze sprzedaży składników majątkowych', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0920', name: 'Wpływy z pozostałych odsetek', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0940', name: 'Wpływy z rozliczeń/zwrotów z lat ubiegłych', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0960', name: 'Wpływy z otrzymanych spadków, zapisów i darowizn w postaci pieniężnej', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '0970', name: 'Wpływy z różnych dochodów', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80101', paragraf: '2030', name: 'Dotacja celowa otrzymana z budżetu państwa na realizację własnych zadań bieżących gmin', type: 'DOCHOD' },

    // Rozdział 80148 - Stołówki szkolne
    { dzial: '801', rozdzial: '80148', paragraf: '0830', name: 'Wpływy z usług (stołówka)', type: 'DOCHOD' },
    { dzial: '801', rozdzial: '80148', paragraf: '0970', name: 'Wpływy z różnych dochodów (stołówka)', type: 'DOCHOD' },

    // ============ WYDATKI ============
    // Rozdział 80101 - Szkoły podstawowe
    { dzial: '801', rozdzial: '80101', paragraf: '3020', name: 'Wydatki osobowe niezaliczone do wynagrodzeń', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4010', name: 'Wynagrodzenia osobowe pracowników', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4040', name: 'Dodatkowe wynagrodzenie roczne', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4110', name: 'Składki na ubezpieczenia społeczne', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4120', name: 'Składki na Fundusz Pracy oraz Fundusz Solidarnościowy', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4170', name: 'Wynagrodzenia bezosobowe', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4210', name: 'Zakup materiałów i wyposażenia', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4240', name: 'Zakup środków dydaktycznych i książek', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4260', name: 'Zakup energii', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4270', name: 'Zakup usług remontowych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4280', name: 'Zakup usług zdrowotnych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4300', name: 'Zakup usług pozostałych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4350', name: 'Zakup towarów (w celu odsprzedaży)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4360', name: 'Opłaty z tytułu zakupu usług telekomunikacyjnych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4410', name: 'Podróże służbowe krajowe', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4430', name: 'Różne opłaty i składki', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4440', name: 'Odpisy na zakładowy fundusz świadczeń socjalnych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4480', name: 'Podatek od nieruchomości', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4520', name: 'Opłaty na rzecz budżetów jednostek samorządu terytorialnego', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4700', name: 'Szkolenia pracowników niebędących członkami korpusu służby cywilnej', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4790', name: 'Wynagrodzenia osobowe nauczycieli', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '4800', name: 'Dodatkowe wynagrodzenie roczne nauczycieli', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '6050', name: 'Wydatki inwestycyjne jednostek budżetowych', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80101', paragraf: '6060', name: 'Wydatki na zakupy inwestycyjne jednostek budżetowych', type: 'WYDATEK' },

    // Rozdział 80103 - Oddziały przedszkolne
    { dzial: '801', rozdzial: '80103', paragraf: '3020', name: 'Wydatki osobowe niezaliczone do wynagrodzeń (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4010', name: 'Wynagrodzenia osobowe pracowników (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4040', name: 'Dodatkowe wynagrodzenie roczne (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4110', name: 'Składki na ubezpieczenia społeczne (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4120', name: 'Składki na Fundusz Pracy (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4210', name: 'Zakup materiałów i wyposażenia (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4240', name: 'Zakup środków dydaktycznych (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4440', name: 'Odpisy na ZFŚS (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4790', name: 'Wynagrodzenia osobowe nauczycieli (oddz. przedszkolne)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80103', paragraf: '4800', name: 'Dodatkowe wynagrodzenie roczne nauczycieli (oddz. przedszkolne)', type: 'WYDATEK' },

    // Rozdział 80146 - Dokształcanie i doskonalenie nauczycieli
    { dzial: '801', rozdzial: '80146', paragraf: '4300', name: 'Zakup usług pozostałych (doskonalenie nauczycieli)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80146', paragraf: '4700', name: 'Szkolenia pracowników (doskonalenie nauczycieli)', type: 'WYDATEK' },

    // Rozdział 80148 - Stołówki szkolne
    { dzial: '801', rozdzial: '80148', paragraf: '3020', name: 'Wydatki osobowe niezaliczone do wynagrodzeń (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4010', name: 'Wynagrodzenia osobowe pracowników (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4040', name: 'Dodatkowe wynagrodzenie roczne (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4110', name: 'Składki na ubezpieczenia społeczne (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4120', name: 'Składki na Fundusz Pracy (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4210', name: 'Zakup materiałów i wyposażenia (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4220', name: 'Zakup środków żywności', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4260', name: 'Zakup energii (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4270', name: 'Zakup usług remontowych (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4300', name: 'Zakup usług pozostałych (stołówka)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80148', paragraf: '4440', name: 'Odpisy na ZFŚS (stołówka)', type: 'WYDATEK' },

    // Rozdział 80195 - Pozostała działalność
    { dzial: '801', rozdzial: '80195', paragraf: '4210', name: 'Zakup materiałów i wyposażenia (pozostała działalność)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80195', paragraf: '4300', name: 'Zakup usług pozostałych (pozostała działalność)', type: 'WYDATEK' },
    { dzial: '801', rozdzial: '80195', paragraf: '4440', name: 'Odpisy na ZFŚS (pozostała działalność)', type: 'WYDATEK' },
  ];

  // Dodaj klasyfikacje
  for (const cls of classifications) {
    await prisma.budgetClassification.create({
      data: {
        unitId: unit.id,
        journalId: budzetJournal.id,
        dzial: cls.dzial,
        rozdzial: cls.rozdzial,
        paragraf: cls.paragraf,
        name: cls.name,
        type: cls.type as any,
        isActive: true,
      },
    });
  }

  console.log(`✅ Dodano ${classifications.length} klasyfikacji budżetowych`);
  console.log('🎉 Zakończono!');
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

