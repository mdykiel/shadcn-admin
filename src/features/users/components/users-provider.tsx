import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type User, type Role } from '../data/schema'

export type Journal = {
  id: string
  name: string
  shortName: string
}

export type FiscalPeriod = {
  id: string
  name: string
}

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  roles: Role[]
  journals: Journal[]
  fiscalPeriods: FiscalPeriod[]
}

const UsersContext = React.createContext<UsersContextType | null>(null)

interface UsersProviderProps {
  children: React.ReactNode
  roles?: Role[]
  journals?: Journal[]
  fiscalPeriods?: FiscalPeriod[]
}

export function UsersProvider({
  children,
  roles = [],
  journals = [],
  fiscalPeriods = []
}: UsersProviderProps) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow, roles, journals, fiscalPeriods }}>
      {children}
    </UsersContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersContext>')
  }

  return usersContext
}
