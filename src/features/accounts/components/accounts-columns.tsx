import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { ChevronRight } from 'lucide-react'
import { Account, AccountType } from '@/types/auth'
import { DataTableRowActions } from './data-table-row-actions'

const accountTypeLabels: Record<AccountType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'BILANSOWE_AKTYWNE': { label: 'Bil. Aktywa', variant: 'default' },
  'BILANSOWE_PASYWNE': { label: 'Bil. Pasywa', variant: 'secondary' },
  'BILANSOWE_AKTYWNO_PASYWNE': { label: 'Bil. Akt-Pas', variant: 'outline' },
  'WYNIKOWE_KOSZTOWE': { label: 'Wyn. Koszty', variant: 'destructive' },
  'WYNIKOWE_PRZYCHODOWE': { label: 'Wyn. Przychody', variant: 'default' },
  'POZABILANSOWE': { label: 'Pozabilansowe', variant: 'outline' },
  'ROZLICZENIOWE': { label: 'Rozliczeniowe', variant: 'secondary' },
}

export const accountsColumns: ColumnDef<Account>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Numer konta' />
    ),
    cell: ({ row }) => {
      const number = row.getValue('number') as string
      const account = row.original
      // Określ poziom wcięcia na podstawie struktury konta
      const hasAnalytical = account.analitpierwsze || account.analitdrugie
      const indent = hasAnalytical ? 'ml-4' : ''

      return (
        <div className={`font-mono text-sm min-w-20 ${indent}`}>
          {number}
        </div>
      )
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nazwa konta' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const account = row.original
      const isActive = account.isActive
      // Określ poziom wcięcia na podstawie struktury konta
      const hasAnalytical = account.analitpierwsze || account.analitdrugie
      const indent = hasAnalytical ? 'ml-4' : ''

      return (
        <div className={`flex items-center gap-2 ${indent}`}>
          {hasAnalytical && (
            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
          )}
          <span className={isActive ? '' : 'text-muted-foreground line-through'}>
            {name}
          </span>
          {!isActive && (
            <Badge variant='outline' className='text-xs'>
              Nieaktywne
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'zespol',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Zespół' />
    ),
    cell: ({ row }) => {
      const zespol = row.getValue('zespol') as number
      return (
        <Badge variant='outline' className='font-mono'>
          {zespol}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const zespol = row.getValue(id) as number
      return value.includes(zespol)
    },
  },
  {
    accessorKey: 'accountType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Typ konta' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('accountType') as AccountType
      const typeConfig = accountTypeLabels[type]

      if (!typeConfig) return null

      return (
        <Badge variant={typeConfig.variant}>
          {typeConfig.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const type = row.getValue(id) as AccountType
      return value.includes(type)
    },
  },
  {
    accessorKey: 'normalBalance',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Saldo normalne' />
    ),
    cell: ({ row }) => {
      const balance = row.getValue('normalBalance') as 'DEBIT' | 'CREDIT'
      return (
        <Badge variant={balance === 'DEBIT' ? 'default' : 'secondary'}>
          {balance === 'DEBIT' ? 'Wn' : 'Ma'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Opis' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return description ? (
        <span className='text-muted-foreground text-sm truncate max-w-40'>
          {description}
        </span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]