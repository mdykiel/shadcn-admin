import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Account } from '@/types/auth'

type AccountsDialogType = 'add' | 'edit' | 'delete' | 'toggleActive' | 'copyToPeriod' | 'initializeFromTemplate' | 'addAnalytical'

type AccountsContextType = {
  open: AccountsDialogType | null
  setOpen: (str: AccountsDialogType | null) => void
  currentRow: Account | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Account | null>>
  selectedJournalId: string
  setSelectedJournalId: React.Dispatch<React.SetStateAction<string>>
  selectedFiscalPeriodId: string
  setSelectedFiscalPeriodId: React.Dispatch<React.SetStateAction<string>>
}

const AccountsContext = React.createContext<AccountsContextType | null>(null)

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<AccountsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Account | null>(null)
  const [selectedJournalId, setSelectedJournalId] = useState<string>('all')
  const [selectedFiscalPeriodId, setSelectedFiscalPeriodId] = useState<string>('')

  return (
    <AccountsContext.Provider value={{
      open, setOpen, currentRow, setCurrentRow,
      selectedJournalId, setSelectedJournalId,
      selectedFiscalPeriodId, setSelectedFiscalPeriodId
    }}>
      {children}
    </AccountsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAccounts = () => {
  const accountsContext = React.useContext(AccountsContext)

  if (!accountsContext) {
    throw new Error('useAccounts has to be used within <AccountsProvider>')
  }

  return accountsContext
}