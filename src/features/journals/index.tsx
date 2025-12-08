import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { JournalsProvider } from './components/journals-provider'
import { JournalsTable } from './components/journals-table'
import { JournalsDialogs } from './components/journals-dialogs'
import { JournalsPrimaryButtons } from './components/journals-primary-buttons'

interface JournalsProps {
  search: Record<string, unknown>
  navigate: (opts: { search: Record<string, unknown> }) => void
}

export function Journals({ search, navigate }: JournalsProps) {
  return (
    <JournalsProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Dzienniki</h2>
            <p className='text-muted-foreground'>
              Zarządzaj dziennikami księgowymi jednostki budżetowej.
            </p>
          </div>
          <JournalsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <JournalsTable search={search} navigate={navigate} />
        </div>
      </Main>

      <JournalsDialogs />
    </JournalsProvider>
  )
}

