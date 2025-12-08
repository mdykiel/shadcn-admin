import { useState, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { OperationsProvider, useOperations } from './components/operations-provider'
import { OperationsTable } from './components/operations-table'
import { OperationsDialogs } from './components/operations-dialogs'

function OperationsPrimaryButtons() {
  const { setOpen } = useOperations()
  return (
    <Button onClick={() => setOpen('add')} className="space-x-1">
      <span>Dodaj operację</span> <Plus className="h-4 w-4" />
    </Button>
  )
}

export default function Operations() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/operations/' })
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <OperationsProvider>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dziennik księgowań</h2>
            <p className="text-muted-foreground">
              Przeglądaj i zarządzaj operacjami gospodarczymi
            </p>
          </div>
          <OperationsPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
          <OperationsTable
            key={refreshKey}
            search={search}
            navigate={navigate}
          />
        </div>
      </Main>

      <OperationsDialogs onRefresh={handleRefresh} />
    </OperationsProvider>
  )
}

