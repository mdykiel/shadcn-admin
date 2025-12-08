import api from '@/lib/api'
import { 
  Operation, 
  JournalEntry, 
  CreateOperationData, 
  CreateJournalEntryData,
  OperationStatus 
} from '@/types/auth'

export const operationsService = {
  async getAll(unitId: string, status?: OperationStatus, journalId?: string): Promise<Operation[]> {
    const params: Record<string, string> = {}
    if (status) params.status = status
    if (journalId) params.journalId = journalId
    const response = await api.get(`/operations/unit/${unitId}`, { params })
    return response.data
  },

  async getById(id: string): Promise<Operation> {
    const response = await api.get(`/operations/${id}`)
    return response.data
  },

  async create(unitId: string, data: CreateOperationData): Promise<Operation> {
    const response = await api.post(`/operations/unit/${unitId}`, data)
    return response.data
  },

  async update(id: string, data: Partial<CreateOperationData>): Promise<Operation> {
    const response = await api.put(`/operations/${id}`, data)
    return response.data
  },

  async updateStatus(id: string, status: OperationStatus): Promise<Operation> {
    const response = await api.patch(`/operations/${id}/status`, { status })
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/operations/${id}`)
  },

  // Journal Entries
  async addEntry(operationId: string, data: CreateJournalEntryData): Promise<JournalEntry> {
    const response = await api.post(`/operations/${operationId}/entries`, data)
    return response.data
  },

  async updateEntry(entryId: string, data: Partial<CreateJournalEntryData>): Promise<JournalEntry> {
    const response = await api.put(`/operations/entries/${entryId}`, data)
    return response.data
  },

  async deleteEntry(entryId: string): Promise<void> {
    await api.delete(`/operations/entries/${entryId}`)
  },
}

