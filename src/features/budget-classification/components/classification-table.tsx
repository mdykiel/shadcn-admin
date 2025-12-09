import { useEffect, useMemo, useState } from 'react'
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
import { BudgetClassification, Journal } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'
import { journalService } from '@/services/journals'
import { classificationColumns as columns, dzialNames, rozdzialNames } from './classification-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { useClassification } from './classification-provider'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ClassificationTable({ search, navigate }: DataTableProps) {
  const { currentUnit } = useAuthStore()
  const [data, setData] = useState<BudgetClassification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Journal state - use from context for sharing with drawer
  const { selectedJournalId, setSelectedJournalId } = useClassification()
  const [journals, setJournals] = useState<Journal[]>([])
  const [journalsLoaded, setJournalsLoaded] = useState(false)

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dzial', desc: false }
  ])

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
      { columnId: 'name', searchKey: 'name', type: 'string' },
      { columnId: 'dzial', searchKey: 'dzial', type: 'string' },
      { columnId: 'rozdzial', searchKey: 'rozdzial', type: 'string' },
      { columnId: 'type', searchKey: 'type', type: 'array' },
    ],
  })

  // Load journals for filter - only those requiring classification
  useEffect(() => {
    const loadJournals = async () => {
      if (!currentUnit) {
        setJournals([])
        setJournalsLoaded(true)
        return
      }
      try {
        const journalsList = await journalService.getActive(currentUnit.id)
        // Show all journals - user can use any journal for classification
        setJournals(journalsList)
      } catch (error) {
        console.error('Error loading journals:', error)
      } finally {
        setJournalsLoaded(true)
      }
    }
    loadJournals()
  }, [currentUnit])

  // Load classifications data - wait for journals to load first
  useEffect(() => {
    const loadClassifications = async () => {
      if (!currentUnit || !journalsLoaded) {
        return
      }

      try {
        setIsLoading(true)
        // 'all' means no filter, otherwise filter by journalId
        const journalId = selectedJournalId === 'all' ? undefined : selectedJournalId
        const classifications = await budgetClassificationService.getTree(currentUnit.id, journalId)
        setData(classifications)
      } catch (error) {
        console.error('Error loading classifications:', error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadClassifications()
  }, [currentUnit, selectedJournalId, journalsLoaded])

  // Generate filter options from data
  const dzialFilterOptions = useMemo(() => {
    const uniqueDzialy = [...new Set(data.map((c) => c.dzial))].sort()
    return uniqueDzialy.map((dzial) => ({
      label: `${dzial} - ${dzialNames[dzial] || 'Nieznany'}`,
      value: dzial,
    }))
  }, [data])

  const rozdzialFilterOptions = useMemo(() => {
    const uniqueRozdzialy = [...new Set(data.map((c) => c.rozdzial))].sort()
    return uniqueRozdzialy.map((rozdzial) => ({
      label: `${rozdzial} - ${rozdzialNames[rozdzial] || 'Nieznany'}`,
      value: rozdzial,
    }))
  }, [data])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  if (!currentUnit) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold'>Brak wybranej jednostki</h3>
          <p className='text-muted-foreground'>
            Wybierz jednostkę budżetową aby wyświetlić klasyfikację budżetową.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      {/* Journal selector - only journals requiring classification */}
      {journals.length > 0 && (
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Dziennik:</span>
          <Select value={selectedJournalId} onValueChange={setSelectedJournalId}>
            <SelectTrigger className='w-[280px]'>
              <SelectValue placeholder='Wybierz dziennik' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Wszystkie dzienniki</SelectItem>
              {journals.map((journal) => (
                <SelectItem key={journal.id} value={journal.id}>
                  {journal.shortName} - {journal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <DataTableToolbar
        table={table}
        searchPlaceholder='Szukaj klasyfikacji...'
        searchKey='name'
        filters={[
          {
            columnId: 'dzial',
            title: 'Dział',
            options: dzialFilterOptions,
          },
          {
            columnId: 'rozdzial',
            title: 'Rozdział',
            options: rozdzialFilterOptions,
          },
          {
            columnId: 'type',
            title: 'Typ',
            options: [
              { label: 'Dochód', value: 'DOCHOD' },
              { label: 'Wydatek', value: 'WYDATEK' },
              { label: 'Przychód', value: 'PRZYCHOD' },
              { label: 'Rozchód', value: 'ROZCHOD' },
            ],
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'bg-background group-hover/row:bg-muted',
                      header.column.columnDef.meta?.className
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Ładowanie klasyfikacji...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted',
                        cell.column.columnDef.meta?.className
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Brak klasyfikacji budżetowej. <br />
                  <span className='text-muted-foreground text-sm'>
                    Użyj przycisku "Dodaj klasyfikację" lub "Importuj" aby utworzyć klasyfikacje.
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && <DataTablePagination table={table} className='mt-auto' />}
      <DataTableBulkActions table={table} />
    </div>
  )
}

