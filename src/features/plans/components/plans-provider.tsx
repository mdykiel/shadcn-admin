import { createContext, useContext, useState, type ReactNode } from 'react'

export type Plan = {
  id: string
  unitId: string
  year: number
  version: number
  planType: 'PROJEKT' | 'PLAN_PIERWOTNY' | 'PLAN_PO_ZMIANACH'
  status: 'PROJEKT' | 'ZATWIERDZONY' | 'ARCHIWALNY'
  name?: string
  description?: string
  validFrom?: string
  validTo?: string
  approvedAt?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  items: PlanItem[]
  _count?: {
    items: number
    changes: number
    changeRequests: number
  }
}

export type PlanItem = {
  id: string
  planId: string
  classificationId: string
  plannedAmount: string | number
  currentAmount: string | number
  executedAmount: string | number
  classification: {
    id: string
    dzial: string
    rozdzial: string
    paragraf: string
    podparagraf?: string
    name: string
    type: 'DOCHOD' | 'WYDATEK' | 'PRZYCHOD' | 'ROZCHOD'
  }
}

type DialogType = 'add' | 'edit' | 'delete' | 'view' | 'addItem' | 'changeRequest' | null

interface PlansContextType {
  open: DialogType
  setOpen: (dialog: DialogType) => void
  currentPlan: Plan | null
  setCurrentPlan: (plan: Plan | null) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
}

const PlansContext = createContext<PlansContextType | null>(null)

export function PlansProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DialogType>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  return (
    <PlansContext.Provider
      value={{
        open,
        setOpen,
        currentPlan,
        setCurrentPlan,
        selectedYear,
        setSelectedYear,
      }}
    >
      {children}
    </PlansContext.Provider>
  )
}

export function usePlans() {
  const context = useContext(PlansContext)
  if (!context) {
    throw new Error('usePlans must be used within PlansProvider')
  }
  return context
}

