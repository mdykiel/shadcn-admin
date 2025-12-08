import { useEffect, useState } from 'react'
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
import { Copy, FileText } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Account, Journal } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { accountsService } from '@/services/accounts'
import { journalService } from '@/services/journals'
import { fiscalPeriodService, FiscalPeriod } from '@/services/fiscal-periods'
import { AccountsTreeView } from './accounts-tree-view'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { accountsColumns as columns } from './accounts-columns'
import { useAccounts } from './accounts-provider'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function AccountsTable({ search, navigate }: DataTableProps) {
  const { currentUnit } = useAuthStore()
  const [data, setData] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Journal state - use from context for sharing with drawer
  const {
    selectedJournalId, setSelectedJournalId,
    selectedFiscalPeriodId, setSelectedFiscalPeriodId,
    setOpen
  } = useAccounts()
  const [journals, setJournals] = useState<Journal[]>([])
  const [journalsLoaded, setJournalsLoaded] = useState(false)

  // Fiscal periods state
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([])
  const [fiscalPeriodsLoaded, setFiscalPeriodsLoaded] = useState(false)

  // Check if we should show tree view
  const viewMode = (search as any).view || 'list'

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'number', desc: false } // Sort by account number
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
      { columnId: 'number', searchKey: 'number', type: 'string' },
      { columnId: 'accountType', searchKey: 'accountType', type: 'array' },
      { columnId: 'zespol', searchKey: 'zespol', type: 'array' },
    ],
  })

  // Load journals for filter
  useEffect(() => {
    const loadJournals = async () => {
      if (!currentUnit) {
        setJournals([])
        setJournalsLoaded(true)
        return
      }
      try {
        const journalsList = await journalService.getActive(currentUnit.id)
        // Show all journals - user can use any journal for accounts
        setJournals(journalsList)
      } catch (error) {
        console.error('Error loading journals:', error)
      } finally {
        setJournalsLoaded(true)
      }
    }
    loadJournals()
  }, [currentUnit])

  // Load fiscal periods
  useEffect(() => {
    const loadFiscalPeriods = async () => {
      if (!currentUnit) {
        setFiscalPeriods([])
        setFiscalPeriodsLoaded(true)
        return
      }
      try {
        const periods = await fiscalPeriodService.getAll(currentUnit.id)
        setFiscalPeriods(periods)
        // Set active period as default if not already set
        if (!selectedFiscalPeriodId) {
          const activePeriod = periods.find(p => p.isActive)
          if (activePeriod) {
            setSelectedFiscalPeriodId(activePeriod.id)
          } else if (periods.length > 0) {
            setSelectedFiscalPeriodId(periods[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading fiscal periods:', error)
      } finally {
        setFiscalPeriodsLoaded(true)
      }
    }
    loadFiscalPeriods()
  }, [currentUnit, selectedFiscalPeriodId, setSelectedFiscalPeriodId])

  // Load accounts data - wait for journals and fiscal periods to load first
  useEffect(() => {
    const loadAccounts = async () => {
      if (!currentUnit || !journalsLoaded || !fiscalPeriodsLoaded || !selectedFiscalPeriodId) {
        if (fiscalPeriodsLoaded && !selectedFiscalPeriodId) {
          // No fiscal period selected - show empty
          setData([])
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        let accounts: Account[]
        // 'all' means no filter, otherwise filter by journalId
        const journalId = selectedJournalId === 'all' ? undefined : selectedJournalId

        if (viewMode === 'tree') {
          accounts = await accountsService.getTree(currentUnit.id, journalId, selectedFiscalPeriodId)
        } else {
          accounts = await accountsService.getAll(currentUnit.id, journalId, selectedFiscalPeriodId)
        }

        setData(accounts)
      } catch (error) {
        console.error('Error loading accounts:', error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [currentUnit, viewMode, selectedJournalId, journalsLoaded, fiscalPeriodsLoaded, selectedFiscalPeriodId])

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
            Wybierz jednostkę budżetową aby wyświetlić plan kont.
          </p>
        </div>
      </div>
    )
  }

  if (viewMode === 'tree') {
    return <AccountsTreeView accounts={data} isLoading={isLoading} />
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}
    >
      {/* Fiscal period and Journal selectors */}
      <div className='flex flex-wrap items-center gap-4'>
        {/* Fiscal period selector */}
        {fiscalPeriods.length > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Okres obrachunkowy:</span>
            <Select value={selectedFiscalPeriodId} onValueChange={setSelectedFiscalPeriodId}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Wybierz okres' />
              </SelectTrigger>
              <SelectContent>
                {fiscalPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name} {period.isActive && '(aktywny)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Journal selector */}
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

        {/* Show when period has no accounts */}
        {data.length === 0 && !isLoading && selectedFiscalPeriodId && (
          <>
            {/* Copy accounts button - show when there are other periods */}
            {fiscalPeriods.length > 1 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setOpen('copyToPeriod')}
                className='gap-2'
              >
                <Copy className='h-4 w-4' />
                Kopiuj z innego okresu
              </Button>
            )}
            {/* Initialize from template button */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setOpen('initializeFromTemplate')}
              className='gap-2'
            >
              <FileText className='h-4 w-4' />
              Inicjalizuj z szablonu
            </Button>
          </>
        )}
      </div>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Szukaj kont...'
        searchKey='name'
        filters={[
          {
            columnId: 'accountType',
            title: 'Typ konta',
            options: [
              { label: 'Bilansowe - Aktywa', value: 'BILANSOWE_AKTYWNE' },
              { label: 'Bilansowe - Pasywa', value: 'BILANSOWE_PASYWNE' },
              { label: 'Bilansowe - Aktywno-pasywne', value: 'BILANSOWE_AKTYWNO_PASYWNE' },
              { label: 'Wynikowe - Kosztowe', value: 'WYNIKOWE_KOSZTOWE' },
              { label: 'Wynikowe - Przychodowe', value: 'WYNIKOWE_PRZYCHODOWE' },
              { label: 'Pozabilansowe', value: 'POZABILANSOWE' },
              { label: 'Rozliczeniowe', value: 'ROZLICZENIOWE' },
            ],
          },
          {
            columnId: 'zespol',
            title: 'Zespół',
            options: [
              { label: 'Zespół 0 - Środki trwałe', value: 0 },
              { label: 'Zespół 1 - Środki obrotowe', value: 1 },
              { label: 'Zespół 2 - Kapitały i fundusze', value: 2 },
              { label: 'Zespół 3 - Rozrachunki i rozliczenia', value: 3 },
              { label: 'Zespół 4 - Koszty według typów', value: 4 },
              { label: 'Zespół 5 - Koszty według typów i rodzajów', value: 5 },
              { label: 'Zespół 6 - Produkty', value: 6 },
              { label: 'Zespół 7 - Przychody operacyjne', value: 7 },
              { label: 'Zespół 8 - Koszty i przychody finansowe', value: 8 },
            ],
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Ładowanie kont...
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
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Brak kont księgowych. <br />
                  <span className='text-muted-foreground text-sm'>
                    Użyj przycisku "Dodaj konto" aby utworzyć pierwsze konto.
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && (
        <DataTablePagination table={table} className='mt-auto' />
      )}
      <DataTableBulkActions table={table} />
    </div>
  )
}