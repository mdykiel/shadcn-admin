import { createContext, useContext, useState, type ReactNode } from 'react'
import { Journal } from '@/types/auth'

type DialogType = 'add' | 'edit' | 'delete' | null

interface JournalsContextType {
  open: DialogType
  setOpen: (type: DialogType) => void
  currentRow: Journal | null
  setCurrentRow: (row: Journal | null) => void
}

const JournalsContext = createContext<JournalsContextType | null>(null)

export function JournalsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DialogType>(null)
  const [currentRow, setCurrentRow] = useState<Journal | null>(null)

  return (
    <JournalsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </JournalsContext.Provider>
  )
}

export function useJournals() {
  const context = useContext(JournalsContext)
  if (!context) {
    throw new Error('useJournals must be used within a JournalsProvider')
  }
  return context
}

