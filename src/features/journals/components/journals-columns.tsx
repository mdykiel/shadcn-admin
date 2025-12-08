import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { Journal, JournalType } from '@/types/auth'
import { DataTableRowActions } from './data-table-row-actions'
import { Check, X } from 'lucide-react'

const journalTypeLabels: Record<JournalType, string> = {
  BUDZET: 'Budżet',
  WRD: 'WRD',
  ZFSS: 'ZFŚS',
  INNY: 'Inny',
}

const journalTypeColors: Record<JournalType, string> = {
  BUDZET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  WRD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  ZFSS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  INNY: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

export const journalsColumns: ColumnDef<Journal>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Zaznacz wszystkie'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Zaznacz wiersz'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-[40px]',
    },
  },
  {
    accessorKey: 'shortName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Skrót' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-bold'>{row.getValue('shortName')}</span>
    ),
    meta: {
      className: 'w-[80px]',
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nazwa' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='font-medium'>{row.getValue('name')}</span>
        {row.original.isDefault && (
          <Badge variant='outline' className='text-xs'>Domyślny</Badge>
        )}
      </div>
    ),
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string
      return name.toLowerCase().includes(value.toLowerCase())
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Typ' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as JournalType
      return (
        <Badge variant='outline' className={journalTypeColors[type]}>
          {journalTypeLabels[type]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'requiresClassification',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Klasyfikacja' />
    ),
    cell: ({ row }) => {
      const requires = row.getValue('requiresClassification') as boolean
      return requires ? (
        <Check className='h-4 w-4 text-green-600' />
      ) : (
        <X className='h-4 w-4 text-muted-foreground' />
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'hasFinancialPlan',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Plan fin.' />
    ),
    cell: ({ row }) => {
      const has = row.getValue('hasFinancialPlan') as boolean
      return has ? (
        <Check className='h-4 w-4 text-green-600' />
      ) : (
        <X className='h-4 w-4 text-muted-foreground' />
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Aktywny' : 'Nieaktywny'}
        </Badge>
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    meta: {
      className: 'w-[60px]',
    },
  },
]

