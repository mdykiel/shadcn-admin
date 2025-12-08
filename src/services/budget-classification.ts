import api from '@/lib/api';
import { type BudgetClassification, type CreateBudgetClassificationData, type ClassificationType } from '@/types/auth';

export const budgetClassificationService = {
  // Pobierz wszystkie klasyfikacje dla jednostki (opcjonalnie filtrowane po dzienniku)
  async getAll(unitId: string, journalId?: string): Promise<BudgetClassification[]> {
    const response = await api.get<BudgetClassification[]>(`/classifications/unit/${unitId}`, {
      params: journalId ? { journalId } : undefined,
    });
    return response.data;
  },

  // Pobierz klasyfikacje według dziennika
  async getByJournal(unitId: string, journalId: string): Promise<BudgetClassification[]> {
    return this.getAll(unitId, journalId);
  },

  // Pobierz klasyfikacje jako drzewo (dział > rozdział > paragraf)
  async getTree(unitId: string, journalId?: string): Promise<BudgetClassification[]> {
    const response = await api.get<BudgetClassification[]>(`/classifications/unit/${unitId}/tree`, {
      params: journalId ? { journalId } : undefined,
    });
    return response.data;
  },

  // Pobierz klasyfikacje według typu
  async getByType(unitId: string, type: ClassificationType, journalId?: string): Promise<BudgetClassification[]> {
    const response = await api.get<BudgetClassification[]>(`/classifications/unit/${unitId}`, {
      params: { type, ...(journalId ? { journalId } : {}) },
    });
    return response.data;
  },

  // Pobierz pojedynczą klasyfikację
  async getById(unitId: string, id: string): Promise<BudgetClassification | null> {
    const response = await api.get<BudgetClassification>(`/classifications/unit/${unitId}/${id}`);
    return response.data;
  },

  // Utwórz nową klasyfikację
  async create(unitId: string, data: CreateBudgetClassificationData): Promise<BudgetClassification> {
    const response = await api.post<BudgetClassification>(`/classifications/unit/${unitId}`, data);
    return response.data;
  },

  // Aktualizuj klasyfikację
  async update(unitId: string, id: string, data: Partial<CreateBudgetClassificationData>): Promise<BudgetClassification> {
    const response = await api.put<BudgetClassification>(`/classifications/unit/${unitId}/${id}`, data);
    return response.data;
  },

  // Usuń klasyfikację
  async delete(unitId: string, id: string): Promise<void> {
    await api.delete(`/classifications/unit/${unitId}/${id}`);
  },

  // Przełącz status aktywności
  async toggleActive(unitId: string, id: string): Promise<BudgetClassification> {
    const response = await api.patch<BudgetClassification>(`/classifications/unit/${unitId}/${id}/toggle-active`);
    return response.data;
  },
};