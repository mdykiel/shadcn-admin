import * as React from 'react'
import { ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/store/auth'
import { BudgetUnitMutateDrawer } from './budget-unit-mutate-drawer'
import { BudgetUnit } from '@/types/auth'

export function BudgetUnitSwitcher() {
  const { isMobile } = useSidebar()
  const { currentUnit, units, setCurrentUnit } = useAuthStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const handleUnitSelect = (unit: BudgetUnit) => {
    setCurrentUnit(unit)
  }

  if (!units || units.length === 0) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              onClick={() => setIsDrawerOpen(true)}
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <Building2 className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  Dodaj jednostkę
                </span>
                <span className='truncate text-xs'>Brak jednostek</span>
              </div>
              <Plus className='ms-auto size-4' />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <BudgetUnitMutateDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      </>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Building2 className='size-4' />
                </div>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {currentUnit?.name || 'Wybierz jednostkę'}
                  </span>
                  <span className='truncate text-xs'>
                    {currentUnit?.shortName || currentUnit?.unitType || 'Brak jednostki'}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Jednostki budżetowe
              </DropdownMenuLabel>
              {units.map((unit, index) => (
                <DropdownMenuItem
                  key={unit.id}
                  onClick={() => handleUnitSelect(unit)}
                  className='gap-2 p-2'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <Building2 className='size-4 shrink-0' />
                  </div>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-medium'>{unit.name}</span>
                    {unit.shortName && (
                      <span className='truncate text-xs text-muted-foreground'>
                        {unit.shortName}
                      </span>
                    )}
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 p-2'
                onSelect={() => setIsDrawerOpen(true)}
              >
                <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                  <Plus className='size-4' />
                </div>
                <div className='text-muted-foreground font-medium'>
                  Dodaj jednostkę
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <BudgetUnitMutateDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </>
  )
}