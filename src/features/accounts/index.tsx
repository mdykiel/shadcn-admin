import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AccountsDialogs } from './components/accounts-dialogs'
import { AccountsPrimaryButtons } from './components/accounts-primary-buttons'
import { AccountsProvider } from './components/accounts-provider'
import { AccountsTable } from './components/accounts-table'

const route = getRouteApi('/_authenticated/accounts/')

export function ChartOfAccounts() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <AccountsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Plan kont</h2>
            <p className='text-muted-foreground'>
              Zarządzaj planem kont księgowych dla bieżącej jednostki budżetowej.
            </p>
          </div>
          <AccountsPrimaryButtons />
        </div>
        <AccountsTable search={search} navigate={navigate} />
      </Main>

      <AccountsDialogs />
    </AccountsProvider>
  )
}