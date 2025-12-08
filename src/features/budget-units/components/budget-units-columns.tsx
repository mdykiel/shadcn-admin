import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { BudgetUnit } from '@/types/auth'
import { Building2, Building, Landmark } from 'lucide-react'
import { DataTableRowActions } from './data-table-row-actions'

const unitTypeIcons = {
  JEDNOSTKA_BUDZETOWA: Building2,
  ZAKLAD_BUDZETOWY: Building,
  ORGAN_BUDZETU: Landmark,
}

const unitTypeLabels = {
  JEDNOSTKA_BUDZETOWA: 'Jednostka budżetowa',
  ZAKLAD_BUDZETOWY: 'Zakład budżetowy',
  ORGAN_BUDZETU: 'Organ budżetu (JST)',
}

const unitTypeColors = {
  JEDNOSTKA_BUDZETOWA: 'bg-blue-100 text-blue-800 border-blue-200',
  ZAKLAD_BUDZETOWY: 'bg-green-100 text-green-800 border-green-200',
  ORGAN_BUDZETU: 'bg-purple-100 text-purple-800 border-purple-200',
}

export const budgetUnitsColumns: ColumnDef<BudgetUnit>[] = [
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
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nazwa jednostki' />
    ),
    cell: ({ row }) => {
      const { shortName } = row.original
      return (
        <div className='ps-3'>
          <LongText className='max-w-48 font-medium'>{row.getValue('name')}</LongText>
          {shortName && (
            <div className='text-xs text-muted-foreground mt-1'>
              {shortName}
            </div>
          )}
        </div>
      )
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'unitType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Typ jednostki' />
    ),
    cell: ({ row }) => {
      const { unitType } = row.original
      const Icon = unitTypeIcons[unitType]
      const label = unitTypeLabels[unitType]
      const colorClass = unitTypeColors[unitType]

      return (
        <div className='flex items-center gap-x-2'>
          <Badge variant='outline' className={cn('capitalize', colorClass)}>
            <Icon size={14} className='me-1' />
            {label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    id: 'identification',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Identyfikatory' />
    ),
    cell: ({ row }) => {
      const { regon, nip } = row.original
      return (
        <div className='space-y-1'>
          {regon && (
            <div className='text-xs'>
              <span className='text-muted-foreground'>REGON:</span> {regon}
            </div>
          )}
          {nip && (
            <div className='text-xs'>
              <span className='text-muted-foreground'>NIP:</span> {nip}
            </div>
          )}
          {!regon && !nip && (
            <div className='text-xs text-muted-foreground'>Brak danych</div>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'classification',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Klasyfikacja domyślna' />
    ),
    cell: ({ row }) => {
      const { defaultDzial, defaultRozdzial } = row.original
      return (
        <div className='space-y-1'>
          {defaultDzial && (
            <div className='text-xs'>
              <span className='text-muted-foreground'>Dział:</span> {defaultDzial}
            </div>
          )}
          {defaultRozdzial && (
            <div className='text-xs'>
              <span className='text-muted-foreground'>Rozdział:</span> {defaultRozdzial}
            </div>
          )}
          {!defaultDzial && !defaultRozdzial && (
            <div className='text-xs text-muted-foreground'>Nie ustawiono</div>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data utworzenia' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]