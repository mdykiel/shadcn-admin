import { api } from '@/lib/api'

export interface FiscalPeriod {
  id: string
  unitId: string
  name: string
  startDate: string
  endDate: string
  isClosed: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFiscalPeriodData {
  unitId: string
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface UpdateFiscalPeriodData {
  name?: string
  startDate?: string
  endDate?: string
  isClosed?: boolean
  isActive?: boolean
}

export const fiscalPeriodService = {
  async getAll(unitId: string): Promise<FiscalPeriod[]> {
    const response = await api.get<FiscalPeriod[]>(`/fiscal-periods?unitId=${unitId}`)
    return response.data
  },

  async getById(id: string): Promise<FiscalPeriod> {
    const response = await api.get<FiscalPeriod>(`/fiscal-periods/${id}`)
    return response.data
  },

  async getActive(unitId: string): Promise<FiscalPeriod | null> {
    const response = await api.get<FiscalPeriod | null>(`/fiscal-periods/active?unitId=${unitId}`)
    return response.data
  },

  async create(data: CreateFiscalPeriodData): Promise<FiscalPeriod> {
    const response = await api.post<FiscalPeriod>('/fiscal-periods', data)
    return response.data
  },

  async update(id: string, data: UpdateFiscalPeriodData): Promise<FiscalPeriod> {
    const response = await api.put<FiscalPeriod>(`/fiscal-periods/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fiscal-periods/${id}`)
  },

  async setActive(id: string): Promise<FiscalPeriod> {
    const response = await api.post<FiscalPeriod>(`/fiscal-periods/${id}/set-active`)
    return response.data
  },

  async close(id: string): Promise<FiscalPeriod> {
    const response = await api.post<FiscalPeriod>(`/fiscal-periods/${id}/close`)
    return response.data
  },
}

