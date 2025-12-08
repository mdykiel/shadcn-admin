import { api } from '@/lib/api'

export interface TrialBalanceRow {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: string
  normalBalance: string
  // Bilans otwarcia
  boDebit: number
  boCredit: number
  // Obroty w okresie
  turnoverDebit: number
  turnoverCredit: number
  // Obroty narastająco
  cumulativeDebit: number
  cumulativeCredit: number
  // Saldo końcowe
  endingBalanceDebit: number
  endingBalanceCredit: number
}

export interface TrialBalanceParams {
  unitId: string
  journalId?: string
  status?: 'ZADEKRETOWANE' | 'ZAKSIEGOWANE'
  dateFrom?: string
  dateTo?: string
  yearStart?: string
}

export const trialBalanceApi = {
  getTrialBalance: async (params: TrialBalanceParams): Promise<TrialBalanceRow[]> => {
    const searchParams = new URLSearchParams()
    searchParams.set('unitId', params.unitId)
    if (params.journalId) searchParams.set('journalId', params.journalId)
    if (params.status) searchParams.set('status', params.status)
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params.yearStart) searchParams.set('yearStart', params.yearStart)

    const response = await api.get<TrialBalanceRow[]>(`/reports/trial-balance?${searchParams.toString()}`)
    return response.data
  },
}

