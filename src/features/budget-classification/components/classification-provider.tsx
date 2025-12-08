import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { BudgetClassification } from '@/types/auth'

type ClassificationDialogType = 'add' | 'edit' | 'delete' | 'import'

type ClassificationContextType = {
  open: ClassificationDialogType | null
  setOpen: (str: ClassificationDialogType | null) => void
  currentRow: BudgetClassification | null
  setCurrentRow: React.Dispatch<React.SetStateAction<BudgetClassification | null>>
  selectedJournalId: string
  setSelectedJournalId: React.Dispatch<React.SetStateAction<string>>
}

const ClassificationContext = React.createContext<ClassificationContextType | null>(null)

export function ClassificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ClassificationDialogType>(null)
  const [currentRow, setCurrentRow] = useState<BudgetClassification | null>(null)
  const [selectedJournalId, setSelectedJournalId] = useState<string>('all')

  return (
    <ClassificationContext.Provider value={{ open, setOpen, currentRow, setCurrentRow, selectedJournalId, setSelectedJournalId }}>
      {children}
    </ClassificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClassification = () => {
  const classificationContext = React.useContext(ClassificationContext)

  if (!classificationContext) {
    throw new Error('useClassification has to be used within <ClassificationProvider>')
  }

  return classificationContext
}

