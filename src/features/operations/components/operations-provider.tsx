import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Operation } from '@/types/auth'

type OperationsDialogType = 'add' | 'edit' | 'delete' | 'view' | 'decree' | 'post' | 'unpost'

type OperationsContextType = {
  open: OperationsDialogType | null
  setOpen: (str: OperationsDialogType | null) => void
  currentRow: Operation | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Operation | null>>
}

const OperationsContext = React.createContext<OperationsContextType | null>(null)

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<OperationsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Operation | null>(null)

  return (
    <OperationsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </OperationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOperations = () => {
  const operationsContext = React.useContext(OperationsContext)

  if (!operationsContext) {
    throw new Error('useOperations has to be used within <OperationsProvider>')
  }

  return operationsContext
}

