import api from '@/lib/api';
import { Account, CreateAccountData } from '@/types/auth';

export const accountsService = {
  async getAll(unitId: string, journalId?: string, fiscalPeriodId?: string): Promise<Account[]> {
    const params: any = {};
    if (journalId) params.journalId = journalId;
    if (fiscalPeriodId) params.fiscalPeriodId = fiscalPeriodId;

    const response = await api.get<Account[]>(`/accounts/unit/${unitId}`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  async getByJournal(unitId: string, journalId: string, fiscalPeriodId?: string): Promise<Account[]> {
    return this.getAll(unitId, journalId, fiscalPeriodId);
  },

  async getTree(unitId: string, journalId?: string, fiscalPeriodId?: string): Promise<Account[]> {
    const params: any = {};
    if (journalId) params.journalId = journalId;
    if (fiscalPeriodId) params.fiscalPeriodId = fiscalPeriodId;

    const response = await api.get<Account[]>(`/accounts/unit/${unitId}/tree`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  async getById(unitId: string, id: string): Promise<Account> {
    const response = await api.get<Account>(`/accounts/unit/${unitId}/${id}`);
    return response.data;
  },

  async create(unitId: string, data: CreateAccountData): Promise<Account> {
    const response = await api.post<Account>(`/accounts/unit/${unitId}`, data);
    return response.data;
  },

  async update(unitId: string, id: string, data: Partial<CreateAccountData>): Promise<Account> {
    const response = await api.put<Account>(`/accounts/unit/${unitId}/${id}`, data);
    return response.data;
  },

  async delete(unitId: string, id: string): Promise<void> {
    await api.delete(`/accounts/unit/${unitId}/${id}`);
  },

  async deleteMany(unitId: string, ids: string[]): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      `/accounts/unit/${unitId}/delete-many`,
      { ids }
    );
    return response.data;
  },

  async copyToJournal(
    unitId: string,
    accountIds: string[],
    targetJournalId: string,
    targetFiscalPeriodId: string
  ): Promise<{ message: string; count: number; skipped: number }> {
    const response = await api.post<{ message: string; count: number; skipped: number }>(
      `/accounts/unit/${unitId}/copy-to-journal`,
      { accountIds, targetJournalId, targetFiscalPeriodId }
    );
    return response.data;
  },

  async toggleActive(unitId: string, id: string): Promise<Account> {
    const response = await api.patch<Account>(`/accounts/unit/${unitId}/${id}/toggle-active`);
    return response.data;
  },

  async copyToFiscalPeriod(
    unitId: string,
    sourceFiscalPeriodId: string,
    targetFiscalPeriodId: string,
    journalId?: string
  ): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      `/accounts/unit/${unitId}/copy-to-period`,
      { sourceFiscalPeriodId, targetFiscalPeriodId, journalId }
    );
    return response.data;
  },

  async initializeFromTemplate(
    unitId: string,
    journalId: string,
    fiscalPeriodId: string,
    unitType: 'JST' | 'JEDNOSTKA_BUDZETOWA' | 'ZAKLAD_BUDZETOWY'
  ): Promise<{ message: string; count: number; unitType: string }> {
    const response = await api.post<{ message: string; count: number; unitType: string }>(
      `/accounts/unit/${unitId}/initialize-from-template`,
      { journalId, fiscalPeriodId, unitType }
    );
    return response.data;
  },
};