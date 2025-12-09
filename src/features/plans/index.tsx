import { Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlansProvider, usePlans } from './components/plans-provider'
import { PlansTable } from './components/plans-table'
import { PlansDialogs } from './components/plans-dialogs'

function YearSelector() {
  const { selectedYear, setSelectedYear } = usePlans()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Rok" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PlansPrimaryButtons() {
  const { setOpen } = usePlans()
  return (
    <div className="flex items-center gap-2">
      <YearSelector />
      <Button onClick={() => setOpen('add')} className="space-x-1">
        <span>Nowy plan</span> <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

function PlansContent() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['plans'] })
  }

  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Plany finansowe</h2>
            <p className="text-muted-foreground">
              Zarządzaj planami finansowymi jednostki: projekty, plany, zmiany i wnioski o zmianę.
            </p>
          </div>
          <PlansPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
          <PlansTable />
        </div>
      </Main>

      <PlansDialogs onSuccess={handleRefresh} />
    </>
  )
}

export function FinancialPlans() {
  return (
    <PlansProvider>
      <PlansContent />
    </PlansProvider>
  )
}

