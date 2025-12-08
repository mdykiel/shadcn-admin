import api from '@/lib/api';
import { type Journal, type CreateJournalData, type JournalType } from '@/types/auth';

export const journalTypeLabels: Record<JournalType, string> = {
  BUDZET: 'Budżet',
  WRD: 'WRD',
  ZFSS: 'ZFŚS',
  INNY: 'Inny',
};

export const journalService = {
  // Pobierz wszystkie dzienniki dla jednostki
  async getAll(unitId: string, includeInactive = false): Promise<Journal[]> {
    const response = await api.get<Journal[]>(`/journals/unit/${unitId}`, {
      params: { includeInactive },
    });
    return response.data;
  },

  // Pobierz aktywne dzienniki
  async getActive(unitId: string): Promise<Journal[]> {
    return this.getAll(unitId, false);
  },

  // Pobierz dziennik domyślny
  async getDefault(unitId: string): Promise<Journal | null> {
    const response = await api.get<Journal | null>(`/journals/unit/${unitId}/default`);
    return response.data;
  },

  // Pobierz pojedynczy dziennik
  async getById(unitId: string, id: string): Promise<Journal | null> {
    const response = await api.get<Journal>(`/journals/unit/${unitId}/${id}`);
    return response.data;
  },

  // Utwórz nowy dziennik
  async create(unitId: string, data: CreateJournalData): Promise<Journal> {
    const response = await api.post<Journal>(`/journals/unit/${unitId}`, data);
    return response.data;
  },

  // Aktualizuj dziennik
  async update(unitId: string, id: string, data: Partial<CreateJournalData>): Promise<Journal> {
    const response = await api.put<Journal>(`/journals/unit/${unitId}/${id}`, data);
    return response.data;
  },

  // Usuń dziennik
  async delete(unitId: string, id: string): Promise<void> {
    await api.delete(`/journals/unit/${unitId}/${id}`);
  },

  // Przełącz status aktywności
  async toggleActive(unitId: string, id: string): Promise<Journal> {
    const response = await api.patch<Journal>(`/journals/unit/${unitId}/${id}/toggle-active`);
    return response.data;
  },

  // Ustaw jako domyślny
  async setDefault(unitId: string, id: string): Promise<Journal> {
    const response = await api.put<Journal>(`/journals/unit/${unitId}/${id}`, { isDefault: true });
    return response.data;
  },
};

