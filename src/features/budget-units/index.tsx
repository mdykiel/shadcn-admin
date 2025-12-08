import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { BudgetUnitsDialogs } from './components/budget-units-dialogs'
import { BudgetUnitsPrimaryButtons } from './components/budget-units-primary-buttons'
import { BudgetUnitsProvider } from './components/budget-units-provider'
import { BudgetUnitsTable } from './components/budget-units-table'

const route = getRouteApi('/_authenticated/units/')

export function BudgetUnits() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <BudgetUnitsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Jednostki budżetowe</h2>
            <p className='text-muted-foreground'>
              Zarządzaj jednostkami budżetowymi i ich konfiguracją.
            </p>
          </div>
          <BudgetUnitsPrimaryButtons />
        </div>
        <BudgetUnitsTable search={search} navigate={navigate} />
      </Main>

      <BudgetUnitsDialogs />
    </BudgetUnitsProvider>
  )
}