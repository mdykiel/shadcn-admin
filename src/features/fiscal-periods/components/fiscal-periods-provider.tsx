import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { FiscalPeriod } from '@/services/fiscal-periods'

type FiscalPeriodsDialogType = 'add' | 'edit' | 'delete' | 'close' | 'activate'

type FiscalPeriodsContextType = {
  open: FiscalPeriodsDialogType | null
  setOpen: (str: FiscalPeriodsDialogType | null) => void
  currentRow: FiscalPeriod | null
  setCurrentRow: React.Dispatch<React.SetStateAction<FiscalPeriod | null>>
}

const FiscalPeriodsContext = React.createContext<FiscalPeriodsContextType | null>(null)

export function FiscalPeriodsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<FiscalPeriodsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<FiscalPeriod | null>(null)

  return (
    <FiscalPeriodsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </FiscalPeriodsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFiscalPeriods = () => {
  const fiscalPeriodsContext = React.useContext(FiscalPeriodsContext)

  if (!fiscalPeriodsContext) {
    throw new Error('useFiscalPeriods has to be used within <FiscalPeriodsProvider>')
  }

  return fiscalPeriodsContext
}

