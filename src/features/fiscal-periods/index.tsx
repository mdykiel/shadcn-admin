import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { FiscalPeriodsDialogs } from './components/fiscal-periods-dialogs'
import { FiscalPeriodsPrimaryButtons } from './components/fiscal-periods-primary-buttons'
import { FiscalPeriodsProvider } from './components/fiscal-periods-provider'
import { FiscalPeriodsTable } from './components/fiscal-periods-table'

export function FiscalPeriods() {
  return (
    <FiscalPeriodsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Okresy obrachunkowe</h2>
            <p className='text-muted-foreground'>
              Zarządzaj okresami obrachunkowymi jednostki. Każdy okres definiuje zakres dat dla operacji księgowych.
            </p>
          </div>
          <FiscalPeriodsPrimaryButtons />
        </div>
        <FiscalPeriodsTable />
      </Main>

      <FiscalPeriodsDialogs />
    </FiscalPeriodsProvider>
  )
}

