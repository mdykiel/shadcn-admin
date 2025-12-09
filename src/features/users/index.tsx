import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuthStore } from '@/stores/auth-store'
import { usersService } from '@/services/users'
import { rolesService } from '@/services/roles'
import { journalService } from '@/services/journals'
import { fiscalPeriodService } from '@/services/fiscal-periods'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { Skeleton } from '@/components/ui/skeleton'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { currentUnit } = useAuthStore()

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', currentUnit?.id],
    queryFn: () => usersService.getByUnit(currentUnit!.id),
    enabled: !!currentUnit?.id,
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles', currentUnit?.id],
    queryFn: () => rolesService.getByUnit(currentUnit!.id),
    enabled: !!currentUnit?.id,
  })

  const { data: journalsData } = useQuery({
    queryKey: ['journals', currentUnit?.id],
    queryFn: () => journalService.getAll(currentUnit!.id),
    enabled: !!currentUnit?.id,
  })

  const { data: fiscalPeriodsData } = useQuery({
    queryKey: ['fiscal-periods', currentUnit?.id],
    queryFn: () => fiscalPeriodService.getAll(currentUnit!.id),
    enabled: !!currentUnit?.id,
  })

  if (usersLoading) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-[400px] w-full' />
        </Main>
      </>
    )
  }

  return (
    <UsersProvider
      roles={rolesData || []}
      journals={journalsData || []}
      fiscalPeriods={fiscalPeriodsData || []}
    >
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
            <h2 className='text-2xl font-bold tracking-tight'>Użytkownicy</h2>
            <p className='text-muted-foreground'>
              Zarządzaj użytkownikami i ich uprawnieniami.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={users} search={search} navigate={navigate} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
