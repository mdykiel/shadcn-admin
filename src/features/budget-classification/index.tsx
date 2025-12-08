import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ClassificationDialogs } from './components/classification-dialogs'
import { ClassificationPrimaryButtons } from './components/classification-primary-buttons'
import { ClassificationProvider } from './components/classification-provider'
import { ClassificationTable } from './components/classification-table'
import { NavigateFn } from '@/hooks/use-table-url-state'

interface BudgetClassificationProps {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function BudgetClassification({ search, navigate }: BudgetClassificationProps) {
  return (
    <ClassificationProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Klasyfikacja budżetowa</h2>
            <p className='text-muted-foreground'>
              Zarządzaj klasyfikacją budżetową (dział, rozdział, paragraf) dla bieżącej jednostki.
            </p>
          </div>
          <ClassificationPrimaryButtons />
        </div>
        <ClassificationTable search={search} navigate={navigate} />
      </Main>

      <ClassificationDialogs />
    </ClassificationProvider>
  )
}

