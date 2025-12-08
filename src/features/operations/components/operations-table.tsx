import { useEffect, useState, useCallback } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Operation, OperationStatus, Journal } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { operationsService } from '@/services/operations'
import { journalService } from '@/services/journals'
import { operationsColumns as columns } from './operations-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

const statusOptions: { value: OperationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'WPROWADZONE', label: 'Wprowadzone' },
  { value: 'ZADEKRETOWANE', label: 'Zadekretowane' },
  { value: 'ZAKSIEGOWANE', label: 'Zaksięgowane' },
  { value: 'ANULOWANE', label: 'Anulowane' },
]

export function OperationsTable({ search, navigate }: DataTableProps) {
  const { currentUnit } = useAuthStore()
  const [data, setData] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<OperationStatus | 'all'>('all')
  const [selectedJournalId, setSelectedJournalId] = useState<string>('all')
  const [journals, setJournals] = useState<Journal[]>([])

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'entryDate', desc: true }
  ])

  // Pobierz dzienniki
  useEffect(() => {
    if (currentUnit) {
      journalService.getActive(currentUnit.id).then(setJournals).catch(console.error)
    }
  }, [currentUnit])

  // Synced with URL states
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'description', searchKey: 'description', type: 'string' },
      { columnId: 'documentNumber', searchKey: 'documentNumber', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'array' },
    ],
  })

  // Load operations data
  useEffect(() => {
    const loadOperations = async () => {
      if (!currentUnit) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const status = selectedStatus === 'all' ? undefined : selectedStatus
        const journalId = selectedJournalId === 'all' ? undefined : selectedJournalId
        const operations = await operationsService.getAll(currentUnit.id, status, journalId)
        setData(operations)
      } catch (error) {
        console.error('Error loading operations:', error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOperations()
  }, [currentUnit, selectedStatus, selectedJournalId])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  ensurePageInRange(table)

  // Reload function for bulk actions
  const handleRefresh = useCallback(async () => {
    if (currentUnit) {
      const status = selectedStatus === 'all' ? undefined : selectedStatus
      const journalId = selectedJournalId === 'all' ? undefined : selectedJournalId
      const operations = await operationsService.getAll(currentUnit.id, status, journalId)
      setData(operations)
    }
  }, [currentUnit, selectedStatus, selectedJournalId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Ładowanie danych...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Dziennik:</span>
          <Select value={selectedJournalId} onValueChange={setSelectedJournalId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz dziennik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {journals.map((journal) => (
                <SelectItem key={journal.id} value={journal.id}>
                  {journal.shortName} - {journal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DataTableToolbar table={table} />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    row.original.status === 'ANULOWANE' && 'opacity-50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Brak danych do wyświetlenia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} onRefresh={handleRefresh} />
    </div>
  )
}

