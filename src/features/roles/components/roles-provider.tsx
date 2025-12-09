import React, { createContext, useContext, useState } from 'react'
import { type Role, type Permission } from '../data/schema'

type RolesDialogType = 'add' | 'edit' | 'delete' | null

type RolesContextType = {
  open: RolesDialogType
  setOpen: (type: RolesDialogType) => void
  currentRow: Role | null
  setCurrentRow: (row: Role | null) => void
  permissions: Permission[]
  permissionsGrouped: Record<string, Permission[]>
}

const RolesContext = createContext<RolesContextType | null>(null)

type RolesProviderProps = {
  children: React.ReactNode
  permissions: Permission[]
  permissionsGrouped: Record<string, Permission[]>
}

export function RolesProvider({ children, permissions, permissionsGrouped }: RolesProviderProps) {
  const [open, setOpen] = useState<RolesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Role | null>(null)

  return (
    <RolesContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        permissions,
        permissionsGrouped,
      }}
    >
      {children}
    </RolesContext.Provider>
  )
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider')
  }
  return context
}

