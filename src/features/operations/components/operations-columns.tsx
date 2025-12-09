import { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
      return <span className="whitespace-nowrap">{date.toLocaleDateString('pl-PL')}</span>
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Opis" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[250px] truncate" title={row.getValue('description')}>
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
        <div className="font-medium text-right whitespace-nowrap">
          {amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
        </div>
      )
    },
  },
  {
    id: 'entries',
    header: () => <span className="text-xs">Dekrety (Wn → Ma)</span>,
    cell: ({ row }) => {
      const operation = row.original
      const entries = operation.entries || []

      if (entries.length === 0) {
        return (
          <span className="text-xs text-muted-foreground italic">Brak dekretów</span>
        )
      }

      // Calculate totals and check balance
      let totalDebit = 0
      let totalCredit = 0
      entries.forEach(entry => {
        const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : (entry.amount || 0)
        if (entry.debitAccountId || entry.debitAccount) totalDebit += amount
        if (entry.creditAccountId || entry.creditAccount) totalCredit += amount
      })
      totalDebit = Math.round(totalDebit * 100) / 100
      totalCredit = Math.round(totalCredit * 100) / 100
      const isBalanced = totalDebit === totalCredit && totalDebit > 0

      // Get unique accounts for display
      const debitAccounts = [...new Set(entries
        .filter(e => e.debitAccount)
        .map(e => e.debitAccount!.number))]
      const creditAccounts = [...new Set(entries
        .filter(e => e.creditAccount)
        .map(e => e.creditAccount!.number))]

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {/* Debit accounts */}
                <div className="flex items-center gap-0.5">
                  {debitAccounts.slice(0, 2).map((acc, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-[10px] px-1 py-0 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                      {acc}
                    </Badge>
                  ))}
                  {debitAccounts.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{debitAccounts.length - 2}</span>
                  )}
                </div>

                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

                {/* Credit accounts */}
                <div className="flex items-center gap-0.5">
                  {creditAccounts.slice(0, 2).map((acc, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-[10px] px-1 py-0 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                      {acc}
                    </Badge>
                  ))}
                  {creditAccounts.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{creditAccounts.length - 2}</span>
                  )}
                </div>

                {/* Balance indicator */}
                {isBalanced ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-1" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-xs">
                  {entries.length} {entries.length === 1 ? 'dekret' : entries.length < 5 ? 'dekrety' : 'dekretów'}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-600 dark:text-blue-400">Wn: {totalDebit.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
                  <span className="text-green-600 dark:text-green-400">Ma: {totalCredit.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
                </div>
                {!isBalanced && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">⚠ Niezbilansowane</p>
                )}
                {isBalanced && (
                  <p className="text-green-600 dark:text-green-400 text-xs">✓ Zbilansowane</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

