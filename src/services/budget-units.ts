import api from '@/lib/api';
import { BudgetUnit } from '@/types/auth';

export interface CreateBudgetUnitData {
  name: string;
  shortName?: string;
  regon?: string;
  nip?: string;
  unitType?: 'JEDNOSTKA_BUDZETOWA' | 'ZAKLAD_BUDZETOWY' | 'ORGAN_BUDZETU';
  defaultDzial?: string;
  defaultRozdzial?: string;
  fiscalYearStart?: number;
  createDefaultJournals?: boolean;
}

export const budgetUnitsService = {
  async getAll(): Promise<BudgetUnit[]> {
    const response = await api.get<BudgetUnit[]>('/units');
    return response.data;
  },

  async getById(id: string): Promise<BudgetUnit> {
    const response = await api.get<BudgetUnit>(`/units/${id}`);
    return response.data;
  },

  async create(data: CreateBudgetUnitData): Promise<BudgetUnit> {
    const response = await api.post<BudgetUnit>('/units', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateBudgetUnitData>): Promise<BudgetUnit> {
    const response = await api.put<BudgetUnit>(`/units/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/units/${id}`);
  },
};