import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { Operation, OperationStatus, DocumentType } from '@/types/auth'
import { DataTableRowActions } from './data-table-row-actions'

const statusLabels: Record<OperationStatus, string> = {
  WPROWADZONE: 'Wprowadzone',
  ZADEKRETOWANE: 'Zadekretowane',
  ZAKSIEGOWANE: 'Zaksięgowane',
  ANULOWANE: 'Anulowane',
}

const statusColors: Record<OperationStatus, string> = {
  WPROWADZONE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  ZADEKRETOWANE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ZAKSIEGOWANE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  ANULOWANE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

const documentTypeLabels: Record<DocumentType, string> = {
  BO: 'BO',
  FAKTURA_ZAKUP: 'FZ',
  FAKTURA_SPRZEDAZ: 'FS',
  WYCIAG_BANKOWY: 'WB',
  RAPORT_KASOWY: 'RK',
  LISTA_PLAC: 'LP',
  PK: 'PK',
  NOTA_KSIEGOWA: 'NK',
  OT: 'OT',
  LT: 'LT',
  INNE: 'Inne',
}

export const operationsColumns: ColumnDef<Operation>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Zaznacz wszystkie"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Zaznacz wiersz"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue('id') as string
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {id.slice(0, 8)}...
        </span>
      )
    },
  },
  {
    accessorKey: 'journal.shortName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dziennik" />
    ),
    cell: ({ row }) => {
      const journal = row.original.journal
      if (!journal) return '-'
      return (
        <Badge variant="outline" className="font-mono">
          {journal.shortName}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const journal = row.original.journal
      return journal ? value.includes(journal.id) : false
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as OperationStatus
      return (
        <Badge className={statusColors[status]} variant="outline">
          {statusLabels[status]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'documentNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nr dokumentu" />
    ),
    cell: ({ row }) => {
      const docType = row.original.documentType
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {documentTypeLabels[docType]}
          </Badge>
          <span className="font-medium">{row.getValue('documentNumber')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'entryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data wprowadzenia" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('entryDate'))
      return date.toLocaleDateString('pl-PL')
    },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Termin płatności" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('dueDate')
      if (!value) return '-'
      const date = new Date(value as string)
      return date.toLocaleDateString('pl-PL')
    },
  },
  {
    accessorKey: 'bookingDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data księgowania" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('bookingDate')
      if (!value) return '-'
      const date = new Date(value as string)
      return date.toLocaleDateString('pl-PL')
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Opis" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate" title={row.getValue('description')}>
        {row.getValue('description')}
      </div>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kwota" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'))
      return (
        <div className="font-medium text-right">
          {amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
        </div>
      )
    },
  },
  {
    accessorKey: 'contractorName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kontrahent" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.getValue('contractorName') || '-'}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

