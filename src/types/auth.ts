export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type UserUnitRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface UserUnit {
  id: string;
  userId: string;
  unitId: string;
  role: UserUnitRole;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  unit?: BudgetUnit;
  user?: User;
}

export interface BudgetUnit {
  id: string;
  name: string;
  shortName?: string;
  regon?: string;
  nip?: string;
  unitType: 'JEDNOSTKA_BUDZETOWA' | 'ZAKLAD_BUDZETOWY' | 'ORGAN_BUDZETU';
  defaultDzial?: string;
  defaultRozdzial?: string;
  fiscalYearStart: number;
  createdAt: string;
  updatedAt: string;
  // Opcjonalnie - rola użytkownika w tej jednostce (gdy pobrane przez użytkownika)
  userRole?: UserUnitRole;
  isUserOwner?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentUnit: BudgetUnit | null;
  units: BudgetUnit[];
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  units: BudgetUnit[];
}

export type AccountType =
  | 'BILANSOWE_AKTYWNE'      // Aktywa (saldo Wn)
  | 'BILANSOWE_PASYWNE'      // Pasywa (saldo Ma)
  | 'BILANSOWE_AKTYWNO_PASYWNE'
  | 'WYNIKOWE_KOSZTOWE'      // Koszty (saldo Wn)
  | 'WYNIKOWE_PRZYCHODOWE'   // Przychody (saldo Ma)
  | 'POZABILANSOWE'
  | 'ROZLICZENIOWE';         // np. 490, 580

export type BalanceSide = 'DEBIT' | 'CREDIT'; // Winien | Ma

export interface Account {
  id: string;
  unitId: string;
  journalId: string;     // Powiązanie z dziennikiem
  fiscalPeriodId?: string; // Powiązanie z okresem obrachunkowym

  number: string;        // np. "011", "130-01", "201-01-001"
  name: string;          // np. "Środki trwałe"

  zespol: number;        // 0-8
  syntetyczne: string;   // np. "011", "130"
  analitpierwsze?: string; // np. "01" z "130-01"
  analitdrugie?: string;   // np. "001" z "201-01-001"

  accountType: AccountType;
  normalBalance: BalanceSide;

  isActive: boolean;
  description?: string;

  parentId?: string;
  children?: Account[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountData {
  journalId: string;     // Powiązanie z dziennikiem
  fiscalPeriodId?: string; // Powiązanie z okresem obrachunkowym
  number: string;
  name: string;
  zespol: number;
  syntetyczne: string;
  analitpierwsze?: string;
  analitdrugie?: string;
  accountType: AccountType;
  normalBalance: BalanceSide;
  description?: string;
  parentId?: string;
}

// ==================== KLASYFIKACJA BUDŻETOWA ====================

export type ClassificationType = 'DOCHOD' | 'WYDATEK' | 'PRZYCHOD' | 'ROZCHOD';

export interface BudgetClassification {
  id: string;
  unitId: string;
  journalId: string;     // Powiązanie z dziennikiem (wymagane dla dzienników z requiresClassification=true)

  dzial: string;         // np. "801"
  rozdzial: string;      // np. "80101"
  paragraf: string;      // np. "4010"
  podparagraf?: string;  // opcjonalny 4. poziom, np. "01"

  name: string;          // Opis paragrafu/rozdziału
  type: ClassificationType;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetClassificationData {
  journalId: string;     // Powiązanie z dziennikiem
  dzial: string;
  rozdzial: string;
  paragraf: string;
  podparagraf?: string;
  name: string;
  type: ClassificationType;
}

// ==================== DZIENNIKI ====================

export type JournalType = 'BUDZET' | 'WRD' | 'ZFSS' | 'INNY';

export interface Journal {
  id: string;
  unitId: string;

  name: string;                        // np. "Budżet", "WRD", "ZFŚS"
  shortName: string;                   // np. "BUD", "WRD", "ZFSS"
  type: JournalType;
  description?: string;

  requiresClassification: boolean;     // czy wymaga klasyfikacji budżetowej
  hasOwnAccountPlan: boolean;          // czy ma własny plan kont
  hasFinancialPlan: boolean;           // czy ma plan finansowy

  isDefault: boolean;                  // czy jest domyślny dla jednostki
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalData {
  name: string;
  shortName: string;
  type: JournalType;
  description?: string;
  requiresClassification: boolean;
  hasOwnAccountPlan: boolean;
  hasFinancialPlan: boolean;
  isDefault?: boolean;
}

// ==================== OPERACJE GOSPODARCZE ====================

export type OperationStatus = 'WPROWADZONE' | 'ZADEKRETOWANE' | 'ZAKSIEGOWANE' | 'ANULOWANE';

export type DocumentType =
  | 'BO'              // Bilans otwarcia - specjalny dokument dla ZOIS
  | 'FAKTURA_ZAKUP'
  | 'FAKTURA_SPRZEDAZ'
  | 'WYCIAG_BANKOWY'
  | 'RAPORT_KASOWY'
  | 'LISTA_PLAC'
  | 'PK'              // Polecenie księgowania
  | 'NOTA_KSIEGOWA'
  | 'OT'              // Przyjęcie środka trwałego
  | 'LT'              // Likwidacja środka trwałego
  | 'INNE';

export interface Operation {
  id: string;
  unitId: string;
  journalId: string;
  journal?: Journal;

  entryDate: string;        // Data wprowadzenia
  bookingDate?: string;     // Data księgowania
  dueDate?: string;         // Termin płatności

  documentNumber: string;   // Nr dokumentu (FV/001/2024)
  documentType: DocumentType;

  description: string;      // Opis operacji

  contractorName?: string;
  contractorNip?: string;

  totalAmount: number;

  status: OperationStatus;

  createdAt: string;
  updatedAt: string;

  entries?: JournalEntry[];
}

export interface JournalEntry {
  id: string;
  operationId: string;

  // Konta bilansowe
  debitAccountId: string;
  debitAccount?: Account;

  creditAccountId: string;
  creditAccount?: Account;

  amount: number;

  // Konta pozabilansowe (księgowanie równoległe)
  offBalanceDebitAccountId?: string;
  offBalanceDebitAccount?: Account;

  offBalanceCreditAccountId?: string;
  offBalanceCreditAccount?: Account;

  // Klasyfikacja budżetowa
  classificationId?: string;
  classification?: BudgetClassification;

  description?: string;
  journalNumber?: number;

  createdAt: string;
}

export interface CreateOperationData {
  journalId: string;        // Wymagany dziennik
  entryDate?: string;       // Data wprowadzenia (domyślnie teraz)
  bookingDate?: string;     // Data księgowania
  dueDate?: string;         // Termin płatności
  documentNumber: string;
  documentType: DocumentType;
  description: string;
  contractorName?: string;
  contractorNip?: string;
  totalAmount: number;
  entries?: CreateJournalEntryData[];  // Dekrety
}

export interface CreateJournalEntryData {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  offBalanceDebitAccountId?: string;
  offBalanceCreditAccountId?: string;
  classificationId?: string;
  description?: string;
}