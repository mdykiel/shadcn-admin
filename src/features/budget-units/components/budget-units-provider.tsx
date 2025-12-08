import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { BudgetUnit } from '@/types/auth'

type BudgetUnitsDialogType = 'add' | 'edit' | 'delete' | 'initialize'

type BudgetUnitsContextType = {
  open: BudgetUnitsDialogType | null
  setOpen: (str: BudgetUnitsDialogType | null) => void
  currentRow: BudgetUnit | null
  setCurrentRow: React.Dispatch<React.SetStateAction<BudgetUnit | null>>
}

const BudgetUnitsContext = React.createContext<BudgetUnitsContextType | null>(null)

export function BudgetUnitsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<BudgetUnitsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<BudgetUnit | null>(null)

  return (
    <BudgetUnitsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </BudgetUnitsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBudgetUnits = () => {
  const budgetUnitsContext = React.useContext(BudgetUnitsContext)

  if (!budgetUnitsContext) {
    throw new Error('useBudgetUnits has to be used within <BudgetUnitsProvider>')
  }

  return budgetUnitsContext
}