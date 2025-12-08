import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { fiscalPeriodService } from '@/services/fiscal-periods'
import { useAuthStore } from '@/store/auth'
import { fiscalPeriodsColumns as columns } from './fiscal-periods-columns'
import { Skeleton } from '@/components/ui/skeleton'

export function FiscalPeriodsTable() {
  const { currentUnit } = useAuthStore()
  const unitId = currentUnit?.id || ''

  const { data = [], isLoading } = useQuery({
    queryKey: ['fiscal-periods', unitId],
    queryFn: () => fiscalPeriodService.getAll(unitId),
    enabled: !!unitId,
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startDate', desc: true }
  ])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='rounded-md border overflow-hidden'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Brak okresów obrachunkowych. <br />
                  <span className='text-muted-foreground text-sm'>
                    Użyj przycisku "Dodaj okres" aby utworzyć pierwszy okres obrachunkowy.
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}

