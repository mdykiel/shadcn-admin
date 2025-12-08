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
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useAuthStore } from '@/store/auth'
import { journalService } from '@/services/journals'
import { Journal } from '@/types/auth'
import { journalsColumns as columns } from './journals-columns'
import { JournalsPrimaryButtons } from './journals-primary-buttons'
import { DataTableBulkActions } from './data-table-bulk-actions'

interface JournalsTableProps {
  search: Record<string, unknown>
  navigate: (opts: { search: Record<string, unknown> }) => void
}

export function JournalsTable({ search, navigate }: JournalsTableProps) {
  const { currentUnit } = useAuthStore()
  const [data, setData] = useState<Journal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<any[]>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false }
  ])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    async function loadData() {
      if (!currentUnit) {
        setData([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const journals = await journalService.getAll(currentUnit.id)
        setData(journals)
      } catch (error) {
        console.error('Error loading journals:', error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [currentUnit])

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
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
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

  if (!currentUnit) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold'>Brak wybranej jednostki</h3>
          <p className='text-muted-foreground'>
            Wybierz jednostkę budżetową aby wyświetlić dzienniki.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-1 flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Szukaj dzienników...'
        searchKey='name'
        filters={[
          {
            columnId: 'type',
            title: 'Typ',
            options: [
              { label: 'Budżet', value: 'BUDZET' },
              { label: 'WRD', value: 'WRD' },
              { label: 'ZFŚS', value: 'ZFSS' },
              { label: 'Inny', value: 'INNY' },
            ],
          },
        ]}
      >
        <JournalsPrimaryButtons />
      </DataTableToolbar>
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Ładowanie dzienników...
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
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Brak dzienników. <br />
                  <span className='text-muted-foreground text-sm'>
                    Użyj przycisku "Dodaj dziennik" aby utworzyć pierwszy dziennik.
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

