# Asystent Księgowy Budżetówki - Dokumentacja Techniczna

## 1. Opis projektu

Aplikacja webowa do nauki i praktyki księgowości w jednostkach sektora finansów publicznych. Umożliwia użytkownikom tworzenie wirtualnych jednostek budżetowych, definiowanie planów kont, klasyfikacji budżetowej, rejestrowanie operacji gospodarczych i generowanie sprawozdań.

## 2. Stack technologiczny

```
Frontend: React 18 + TypeScript + Vite
State: Zustand lub React Query
Styling: Tailwind CSS + shadcn/ui
Routing: React Router v6

Backend: Node.js + Express + TypeScript
ORM: Prisma
Baza danych: PostgreSQL
Autoryzacja: JWT + bcrypt
Walidacja: Zod

Narzędzia: ESLint, Prettier, Vitest
```

## 3. Struktura projektu

```
budget-accounting-app/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn komponenty
│   │   │   ├── layout/       # Header, Sidebar, Layout
│   │   │   ├── forms/        # Formularze (konto, operacja, etc.)
│   │   │   └── tables/       # Tabele danych
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── dashboard/    # Panel główny
│   │   │   ├── units/        # Zarządzanie jednostkami
│   │   │   ├── accounts/     # Plan kont
│   │   │   ├── classification/ # Klasyfikacja budżetowa
│   │   │   ├── operations/   # Operacje gospodarcze
│   │   │   ├── journal/      # Dziennik
│   │   │   └── reports/      # Sprawozdania
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API calls
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Helpers
│   └── package.json
├── server/                    # Backend Node.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts           # Dane początkowe (wzorcowy plan kont)
│   └── package.json
└── README.md
```

## 4. Model danych (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== UŻYTKOWNICY ====================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  units         BudgetUnit[]
}

// ==================== JEDNOSTKA BUDŻETOWA ====================

model BudgetUnit {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String    // np. "Szkoła Podstawowa nr 5"
  shortName     String?   // np. "SP5"
  regon         String?
  nip           String?
  unitType      UnitType  @default(JEDNOSTKA_BUDZETOWA)
  
  // Klasyfikacja nadrzędna
  defaultDzial      String?   // np. "801" - Oświata
  defaultRozdzial   String?   // np. "80101"
  
  fiscalYearStart   Int       @default(1)  // Miesiąc rozpoczęcia roku obrotowego
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts          Account[]
  budgetClassifications BudgetClassification[]
  operations        Operation[]
  financialPlans    FinancialPlan[]
  reports           Report[]
}

enum UnitType {
  JEDNOSTKA_BUDZETOWA
  ZAKLAD_BUDZETOWY
  ORGAN_BUDZETU        // JST jako organ
}

// ==================== PLAN KONT ====================

model Account {
  id            String    @id @default(uuid())
  unitId        String
  unit          BudgetUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  
  number        String    // np. "011", "130-01", "201-01-001"
  name          String    // np. "Środki trwałe"
  
  zespol        Int       // 0-8
  syntetyczne   String    // np. "011", "130"
  analitpierwsze String?  // np. "01" z "130-01"
  analitdrugie  String?   // np. "001" z "201-01-001"
  
  accountType   AccountType
  normalBalance BalanceSide  // Czy saldo normalne po Wn czy Ma
  
  isActive      Boolean   @default(true)
  description   String?
  
  parentId      String?
  parent        Account?  @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      Account[] @relation("AccountHierarchy")
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  debitEntries  JournalEntry[] @relation("DebitAccount")
  creditEntries JournalEntry[] @relation("CreditAccount")
  
  @@unique([unitId, number])
  @@index([unitId, zespol])
}

enum AccountType {
  BILANSOWE_AKTYWNE      // Aktywa (saldo Wn)
  BILANSOWE_PASYWNE      // Pasywa (saldo Ma)
  BILANSOWE_AKTYWNO_PASYWNE
  WYNIKOWE_KOSZTOWE      // Koszty (saldo Wn)
  WYNIKOWE_PRZYCHODOWE   // Przychody (saldo Ma)
  POZABILANSOWE
  ROZLICZENIOWE          // np. 490, 580
}

enum BalanceSide {
  DEBIT   // Winien
  CREDIT  // Ma
}

// ==================== KLASYFIKACJA BUDŻETOWA ====================

model BudgetClassification {
  id            String    @id @default(uuid())
  unitId        String
  unit          BudgetUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  
  dzial         String    // np. "801"
  rozdzial      String    // np. "80101"
  paragraf      String    // np. "4010"
  
  // Opcjonalne dalsze podziały
  pozycja       String?   // 4. poziom
  
  name          String    // Opis paragrafu/rozdziału
  type          ClassificationType
  
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  
  planItems     FinancialPlanItem[]
  journalEntries JournalEntry[]
  
  @@unique([unitId, dzial, rozdzial, paragraf])
  @@index([unitId, type])
}

enum ClassificationType {
  DOCHOD
  WYDATEK
  PRZYCHOD
  ROZCHOD
}

// ==================== PLAN FINANSOWY ====================

model FinancialPlan {
  id            String    @id @default(uuid())
  unitId        String
  unit          BudgetUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  
  year          Int
  version       Int       @default(1)  // Wersja planu (zmiany)
  status        PlanStatus @default(PROJEKT)
  
  approvedAt    DateTime?
  approvedBy    String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  items         FinancialPlanItem[]
  
  @@unique([unitId, year, version])
}

enum PlanStatus {
  PROJEKT
  ZATWIERDZONY
  ZMIANA
}

model FinancialPlanItem {
  id                  String    @id @default(uuid())
  planId              String
  plan                FinancialPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  classificationId    String
  classification      BudgetClassification @relation(fields: [classificationId], references: [id])
  
  plannedAmount       Decimal   @db.Decimal(15, 2)
  
  createdAt           DateTime  @default(now())
  
  @@unique([planId, classificationId])
}

// ==================== OPERACJE GOSPODARCZE ====================

model Operation {
  id            String    @id @default(uuid())
  unitId        String
  unit          BudgetUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  
  operationDate DateTime  // Data operacji gospodarczej
  documentDate  DateTime  // Data dokumentu
  documentNumber String   // Nr dokumentu (FV/001/2024)
  documentType  DocumentType
  
  description   String    // Opis operacji
  
  // Kontrahent (opcjonalnie)
  contractorName String?
  contractorNip  String?
  
  totalAmount   Decimal   @db.Decimal(15, 2)
  
  status        OperationStatus @default(DRAFT)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  postedAt      DateTime? // Data zaksięgowania
  
  entries       JournalEntry[]
}

enum DocumentType {
  FAKTURA_ZAKUP
  FAKTURA_SPRZEDAZ
  WYCIAG_BANKOWY
  RAPORT_KASOWY
  LISTA_PLAC
  PK              // Polecenie księgowania
  NOTA_KSIEGOWA
  OT              // Przyjęcie środka trwałego
  LT              // Likwidacja środka trwałego
  INNE
}

enum OperationStatus {
  DRAFT           // Wersja robocza
  POSTED          // Zaksięgowana
  CANCELLED       // Anulowana
}

// ==================== DZIENNIK (ZAPISY KSIĘGOWE) ====================

model JournalEntry {
  id              String    @id @default(uuid())
  
  operationId     String
  operation       Operation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  
  // Dekret księgowy
  debitAccountId  String
  debitAccount    Account   @relation("DebitAccount", fields: [debitAccountId], references: [id])
  
  creditAccountId String
  creditAccount   Account   @relation("CreditAccount", fields: [creditAccountId], references: [id])
  
  amount          Decimal   @db.Decimal(15, 2)
  
  // Klasyfikacja budżetowa (opcjonalnie)
  classificationId String?
  classification  BudgetClassification? @relation(fields: [classificationId], references: [id])
  
  description     String?
  
  // Numer pozycji w dzienniku (auto)
  journalNumber   Int?
  
  createdAt       DateTime  @default(now())
  
  @@index([operationId])
  @@index([debitAccountId])
  @@index([creditAccountId])
}

// ==================== SPRAWOZDANIA ====================

model Report {
  id            String    @id @default(uuid())
  unitId        String
  unit          BudgetUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  
  type          ReportType
  periodStart   DateTime
  periodEnd     DateTime
  
  data          Json      // Wygenerowane dane sprawozdania
  
  generatedAt   DateTime  @default(now())
  
  @@index([unitId, type])
}

enum ReportType {
  BILANS
  RZIS                    // Rachunek zysków i strat
  ZESTAWIENIE_ZMIAN_FUNDUSZU
  ZESTAWIENIE_OBROTOW_SALD
  RB_27S
  RB_28S
  RB_34S
  RB_N
  RB_Z
}
```

## 5. API Endpoints

### 5.1 Autoryzacja

```
POST   /api/auth/register     - Rejestracja
POST   /api/auth/login        - Logowanie
POST   /api/auth/logout       - Wylogowanie
GET    /api/auth/me           - Dane zalogowanego użytkownika
POST   /api/auth/refresh      - Odświeżenie tokena
```

### 5.2 Jednostki budżetowe

```
GET    /api/units             - Lista jednostek użytkownika
POST   /api/units             - Utwórz jednostkę
GET    /api/units/:id         - Szczegóły jednostki
PUT    /api/units/:id         - Aktualizuj jednostkę
DELETE /api/units/:id         - Usuń jednostkę
POST   /api/units/:id/initialize - Zainicjuj wzorcowym planem kont
```

### 5.3 Plan kont

```
GET    /api/units/:unitId/accounts              - Lista kont
POST   /api/units/:unitId/accounts              - Dodaj konto
GET    /api/units/:unitId/accounts/:id          - Szczegóły konta
PUT    /api/units/:unitId/accounts/:id          - Aktualizuj konto
DELETE /api/units/:unitId/accounts/:id          - Usuń konto
GET    /api/units/:unitId/accounts/tree         - Hierarchia kont
GET    /api/units/:unitId/accounts/:id/balance  - Saldo konta
POST   /api/units/:unitId/accounts/import       - Import z szablonu
```

### 5.4 Klasyfikacja budżetowa

```
GET    /api/units/:unitId/classifications       - Lista klasyfikacji
POST   /api/units/:unitId/classifications       - Dodaj pozycję
PUT    /api/units/:unitId/classifications/:id   - Aktualizuj
DELETE /api/units/:unitId/classifications/:id   - Usuń
GET    /api/units/:unitId/classifications/tree  - Drzewo (dział>rozdział>paragraf)
POST   /api/units/:unitId/classifications/import - Import ze słownika
```

### 5.5 Plan finansowy

```
GET    /api/units/:unitId/plans                 - Lista planów
POST   /api/units/:unitId/plans                 - Utwórz plan
GET    /api/units/:unitId/plans/:id             - Szczegóły planu
PUT    /api/units/:unitId/plans/:id             - Aktualizuj plan
POST   /api/units/:unitId/plans/:id/approve     - Zatwierdź plan
POST   /api/units/:unitId/plans/:id/items       - Dodaj pozycję planu
PUT    /api/units/:unitId/plans/:id/items/:itemId - Aktualizuj pozycję
GET    /api/units/:unitId/plans/:id/execution   - Wykonanie planu
```

### 5.6 Operacje gospodarcze

```
GET    /api/units/:unitId/operations            - Lista operacji
POST   /api/units/:unitId/operations            - Utwórz operację
GET    /api/units/:unitId/operations/:id        - Szczegóły operacji
PUT    /api/units/:unitId/operations/:id        - Aktualizuj operację
DELETE /api/units/:unitId/operations/:id        - Usuń operację
POST   /api/units/:unitId/operations/:id/post   - Zaksięguj operację
POST   /api/units/:unitId/operations/:id/cancel - Anuluj operację
```

### 5.7 Dziennik

```
GET    /api/units/:unitId/journal               - Zapisy dziennika
GET    /api/units/:unitId/journal/summary       - Podsumowanie (obroty)
```

### 5.8 Sprawozdania

```
GET    /api/units/:unitId/reports                      - Lista sprawozdań
POST   /api/units/:unitId/reports/generate             - Generuj sprawozdanie
GET    /api/units/:unitId/reports/:id                  - Pobierz sprawozdanie
GET    /api/units/:unitId/reports/balance-sheet        - Bilans (na żywo)
GET    /api/units/:unitId/reports/income-statement     - RZiS (na żywo)
GET    /api/units/:unitId/reports/trial-balance        - ZOiS (na żywo)
GET    /api/units/:unitId/reports/rb27s                - Rb-27S
GET    /api/units/:unitId/reports/rb28s                - Rb-28S
```

## 6. Główne komponenty React

### 6.1 Struktura stron

```typescript
// src/pages - główne widoki

/login                    - Logowanie
/register                 - Rejestracja
/dashboard                - Panel główny (wybór jednostki)
/units/new                - Nowa jednostka
/units/:unitId            - Dashboard jednostki
/units/:unitId/accounts   - Plan kont
/units/:unitId/accounts/new - Dodaj konto
/units/:unitId/classification - Klasyfikacja budżetowa
/units/:unitId/plans      - Plany finansowe
/units/:unitId/plans/:id  - Szczegóły planu
/units/:unitId/operations - Operacje gospodarcze
/units/:unitId/operations/new - Nowa operacja
/units/:unitId/journal    - Dziennik
/units/:unitId/reports    - Sprawozdania
/units/:unitId/reports/balance - Bilans
/units/:unitId/reports/trial-balance - ZOiS
```

### 6.2 Kluczowe komponenty

```typescript
// Layout
<AppLayout>           - Główny layout z sidebar
<UnitLayout>          - Layout dla widoków jednostki
<Sidebar>             - Menu nawigacyjne
<Header>              - Nagłówek z user menu

// Formularze
<AccountForm>         - Formularz konta księgowego
<OperationForm>       - Formularz operacji z dekretacją
<ClassificationSelect> - Wybór klasyfikacji budżetowej
<AccountSelect>       - Wybór konta (z wyszukiwaniem)
<JournalEntryRow>     - Wiersz dekretu (Wn/Ma/Kwota)

// Tabele
<AccountsTable>       - Lista kont z filtrowaniem
<JournalTable>        - Dziennik księgowań
<OperationsTable>     - Lista operacji
<TrialBalanceTable>   - Zestawienie obrotów i sald

// Sprawozdania
<BalanceSheet>        - Bilans
<IncomeStatement>     - Rachunek zysków i strat
<Rb28SReport>         - Sprawozdanie Rb-28S
```

## 7. Logika biznesowa

### 7.1 Tworzenie operacji z dekretacją

```typescript
// Przykład: Zakup materiałów biurowych
{
  documentType: "FAKTURA_ZAKUP",
  documentNumber: "FV/123/2024",
  description: "Zakup materiałów biurowych",
  totalAmount: 1230.00,
  entries: [
    {
      debitAccount: "401",      // Zużycie materiałów
      creditAccount: "201-01",  // Rozrachunki z dostawcami
      amount: 1000.00,
      classification: { dzial: "750", rozdzial: "75023", paragraf: "4210" }
    },
    {
      debitAccount: "225",      // VAT naliczony
      creditAccount: "201-01",
      amount: 230.00
    }
  ]
}
```

### 7.2 Walidacje

```typescript
// Walidacja operacji przed zaksięgowaniem
- Suma Wn === Suma Ma (zasada podwójnego zapisu)
- Wszystkie konta istnieją i są aktywne
- Klasyfikacja budżetowa dla wydatków/dochodów
- Data operacji w otwartym okresie
- Zgodność z planem finansowym (ostrzeżenie przy przekroczeniu)
```

### 7.3 Generowanie sprawozdań

```typescript
// Bilans - mapowanie kont na pozycje bilansu
const balanceSheetMapping = {
  "A.I": ["011", "013", "014", "016"], // Środki trwałe (pomniejszone o 071, 072)
  "A.II": ["020"],                      // WNiP
  "B.I": ["310", "330"],               // Zapasy
  "B.II.1": ["201-02", "221"],         // Należności krótkoterminowe
  // ...
};

// Rb-28S - wykonanie wydatków
// Grupowanie po klasyfikacji + suma zaksięgowanych operacji
```

## 8. Seed data - Wzorcowy plan kont

```typescript
// prisma/seed.ts - dane początkowe

const templateAccounts = [
  // Zespół 0
  { number: "011", name: "Środki trwałe", zespol: 0, accountType: "BILANSOWE_AKTYWNE" },
  { number: "013", name: "Pozostałe środki trwałe", zespol: 0, accountType: "BILANSOWE_AKTYWNE" },
  { number: "020", name: "Wartości niematerialne i prawne", zespol: 0, accountType: "BILANSOWE_AKTYWNE" },
  { number: "071", name: "Umorzenie środków trwałych oraz WNiP", zespol: 0, accountType: "BILANSOWE_PASYWNE" },
  { number: "072", name: "Umorzenie pozostałych środków trwałych", zespol: 0, accountType: "BILANSOWE_PASYWNE" },
  { number: "080", name: "Środki trwałe w budowie (inwestycje)", zespol: 0, accountType: "BILANSOWE_AKTYWNE" },
  
  // Zespół 1
  { number: "101", name: "Kasa", zespol: 1, accountType: "BILANSOWE_AKTYWNE" },
  { number: "130", name: "Rachunek bieżący jednostki", zespol: 1, accountType: "BILANSOWE_AKTYWNE" },
  { number: "130-01", name: "Rachunek wydatków", zespol: 1, accountType: "BILANSOWE_AKTYWNE", parent: "130" },
  { number: "130-02", name: "Rachunek dochodów", zespol: 1, accountType: "BILANSOWE_AKTYWNE", parent: "130" },
  
  // ... pełna lista ~100 kont
];

const templateClassifications = [
  // Działy
  { dzial: "750", rozdzial: "75023", paragraf: "4010", name: "Wynagrodzenia osobowe", type: "WYDATEK" },
  { dzial: "750", rozdzial: "75023", paragraf: "4110", name: "Składki na ubezpieczenia społeczne", type: "WYDATEK" },
  { dzial: "750", rozdzial: "75023", paragraf: "4210", name: "Zakup materiałów i wyposażenia", type: "WYDATEK" },
  // ...
];
```

## 9. Kolejność implementacji (dla Claude Code)

### Faza 1: Fundament
1. Inicjalizacja projektu (Vite + Express)
2. Konfiguracja Prisma + PostgreSQL
3. Model User + autoryzacja JWT
4. Podstawowy layout React

### Faza 2: Core
5. CRUD jednostek budżetowych
6. CRUD planu kont z hierarchią
7. Import wzorcowego planu kont
8. CRUD klasyfikacji budżetowej

### Faza 3: Operacje
9. Formularz operacji z dekretacją
10. Walidacja podwójnego zapisu
11. Księgowanie operacji
12. Widok dziennika

### Faza 4: Plany i kontrola
13. Plan finansowy (CRUD)
14. Wykonanie planu vs plan
15. Ostrzeżenia o przekroczeniach

### Faza 5: Sprawozdania
16. Zestawienie obrotów i sald
17. Bilans
18. Rachunek zysków i strat
19. Rb-27S, Rb-28S

### Faza 6: Polish
20. Eksport do PDF/Excel
21. Tryb nauki (podpowiedzi)
22. Przykładowe operacje do ćwiczeń

## 10. Komendy dla Claude Code

```bash
# Inicjalizacja
claude "Utwórz projekt Node.js + React zgodnie z dokumentacją. 
Zacznij od struktury folderów i package.json dla client i server."

# Baza danych
claude "Zaimplementuj schema.prisma zgodnie z dokumentacją. 
Dodaj seed.ts z wzorcowym planem kont dla jednostek budżetowych."

# Backend
claude "Stwórz Express API z endpointami dla autoryzacji (JWT) 
i CRUD jednostek budżetowych. Użyj Zod do walidacji."

# Frontend
claude "Stwórz layout aplikacji React z Tailwind i shadcn/ui. 
Dodaj routing i strony: login, register, dashboard, lista jednostek."

# Plan kont
claude "Zaimplementuj widok planu kont z hierarchicznym drzewem. 
Dodaj formularz dodawania konta z walidacją numeru i typu."

# Operacje
claude "Stwórz formularz operacji gospodarczej z dynamicznym 
dodawaniem wierszy dekretacji (Wn/Ma). Waliduj zgodność sum."
```