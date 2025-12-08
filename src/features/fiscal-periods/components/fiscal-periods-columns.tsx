import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { FiscalPeriod } from '@/services/fiscal-periods'
import { MoreHorizontal, Pencil, Trash2, Lock, CheckCircle } from 'lucide-react'
import { useFiscalPeriods } from './fiscal-periods-provider'

export const fiscalPeriodsColumns: ColumnDef<FiscalPeriod>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nazwa okresu' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data początkowa' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('startDate'))
      return <div>{date.toLocaleDateString('pl-PL')}</div>
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data końcowa' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('endDate'))
      return <div>{date.toLocaleDateString('pl-PL')}</div>
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      const isClosed = row.original.isClosed
      
      if (isClosed) {
        return <Badge variant='secondary'><Lock className='h-3 w-3 mr-1' /> Zamknięty</Badge>
      }
      if (isActive) {
        return <Badge variant='default'><CheckCircle className='h-3 w-3 mr-1' /> Aktywny</Badge>
      }
      return <Badge variant='outline'>Nieaktywny</Badge>
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const { setOpen, setCurrentRow } = useFiscalPeriods()
      const period = row.original
      const isClosed = period.isClosed

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {!isClosed && (
              <>
                <DropdownMenuItem onClick={() => { setCurrentRow(period); setOpen('edit') }}>
                  <Pencil className='mr-2 h-4 w-4' /> Edytuj
                </DropdownMenuItem>
                {!period.isActive && (
                  <DropdownMenuItem onClick={() => { setCurrentRow(period); setOpen('activate') }}>
                    <CheckCircle className='mr-2 h-4 w-4' /> Ustaw jako aktywny
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { setCurrentRow(period); setOpen('close') }}>
                  <Lock className='mr-2 h-4 w-4' /> Zamknij okres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={() => { setCurrentRow(period); setOpen('delete') }}
              className='text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

