import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { rolesService } from '@/services/roles'
import { RolesProvider } from './components/roles-provider'
import { RolesTable } from './components/roles-table'
import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'

export function Roles() {
  const { currentUnit } = useAuthStore()

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', currentUnit?.id],
    queryFn: () => rolesService.getByUnit(currentUnit!.id),
    enabled: !!currentUnit?.id,
  })

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesService.getAllPermissions(),
  })

  if (rolesLoading) {
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
    <RolesProvider permissions={permissionsData?.permissions || []} permissionsGrouped={permissionsData?.grouped || {}}>
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
            <h2 className='text-2xl font-bold tracking-tight'>Role i uprawnienia</h2>
            <p className='text-muted-foreground'>
              Zarządzaj rolami i grupami uprawnień w jednostce.
            </p>
          </div>
          <RolesPrimaryButtons />
        </div>
        <RolesTable data={roles} />
      </Main>

      <RolesDialogs />
    </RolesProvider>
  )
}

