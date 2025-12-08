import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, Pencil, Eye, EyeOff, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Account } from '@/types/auth'
import { useAccounts } from './accounts-provider'
import { useAuthStore } from '@/store/auth'
import { accountsService } from '@/services/accounts'
import { toast } from 'sonner'

type DataTableRowActionsProps = {
  row: Row<Account>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useAccounts()
  const { currentUnit } = useAuthStore()

  const handleToggleActive = async () => {
    if (!currentUnit) return

    try {
      await accountsService.toggleActive(currentUnit.id, row.original.id)
      toast.success(
        row.original.isActive
          ? 'Konto zostało dezaktywowane'
          : 'Konto zostało aktywowane'
      )
      // In a real app, you'd refresh the data here
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas zmiany statusu konta')
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[200px]'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('addAnalytical')
            }}
          >
            Dodaj analitykę
            <DropdownMenuShortcut>
              <Plus size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Edytuj
            <DropdownMenuShortcut>
              <Pencil size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleToggleActive}
          >
            {row.original.isActive ? 'Dezaktywuj' : 'Aktywuj'}
            <DropdownMenuShortcut>
              {row.original.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            Usuń
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}