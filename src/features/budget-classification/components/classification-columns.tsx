import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { BudgetClassification, ClassificationType } from '@/types/auth'
import { DataTableRowActions } from './data-table-row-actions'

const classificationTypeLabels: Record<ClassificationType, string> = {
  DOCHOD: 'Dochód',
  WYDATEK: 'Wydatek',
  PRZYCHOD: 'Przychód',
  ROZCHOD: 'Rozchód',
}

const classificationTypeColors: Record<ClassificationType, string> = {
  DOCHOD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  WYDATEK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  PRZYCHOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ROZCHOD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

export const classificationColumns: ColumnDef<BudgetClassification>[] = [
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
    accessorKey: 'dzial',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Dział' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-medium'>{row.getValue('dzial')}</span>
    ),
    meta: {
      className: 'w-[80px]',
    },
  },
  {
    accessorKey: 'rozdzial',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rozdział' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-medium'>{row.getValue('rozdzial')}</span>
    ),
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'paragraf',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Paragraf' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-medium'>{row.getValue('paragraf')}</span>
    ),
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'podparagraf',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Podparagraf' />
    ),
    cell: ({ row }) => {
      const podparagraf = row.getValue('podparagraf') as string | undefined
      return podparagraf ? (
        <span className='font-mono font-medium'>{podparagraf}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nazwa' />
    ),
    cell: ({ row }) => (
      <div className='max-w-[400px]'>
        <span className='truncate font-medium'>{row.getValue('name')}</span>
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
      const type = row.getValue('type') as ClassificationType
      return (
        <Badge variant='outline' className={classificationTypeColors[type]}>
          {classificationTypeLabels[type]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[120px]',
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
          {isActive ? 'Aktywna' : 'Nieaktywna'}
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

