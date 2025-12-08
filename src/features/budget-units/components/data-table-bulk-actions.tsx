import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Settings, Download } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { BudgetUnit } from '@/types/auth'
import { budgetUnitsService } from '@/services/budget-units'
import { BudgetUnitsMultiDeleteDialog } from './budget-units-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkInitialize = async () => {
    const selectedUnits = selectedRows.map((row) => row.original as BudgetUnit)

    toast.promise(
      Promise.all(
        selectedUnits.map(unit => budgetUnitsService.initialize(unit.id))
      ),
      {
        loading: 'Inicjalizowanie planów kont...',
        success: () => {
          table.resetRowSelection()
          return `Zainicjowano plan kont dla ${selectedUnits.length} jednostk${selectedUnits.length === 1 ? 'i' : ''}`
        },
        error: 'Błąd podczas inicjalizowania planów kont',
      }
    )
  }

  const handleBulkExport = async () => {
    const selectedUnits = selectedRows.map((row) => row.original as BudgetUnit)

    toast.promise(sleep(1000), {
      loading: 'Eksportowanie danych jednostek...',
      success: () => {
        table.resetRowSelection()
        return `Wyeksportowano dane dla ${selectedUnits.length} jednostk${selectedUnits.length === 1 ? 'i' : ''}`
      },
      error: 'Błąd podczas eksportowania danych',
    })
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='jednostka'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkInitialize}
              className='size-8'
              aria-label='Zainicjuj plany kont dla zaznaczonych jednostek'
              title='Zainicjuj plany kont dla zaznaczonych jednostek'
            >
              <Settings />
              <span className='sr-only'>Zainicjuj plany kont</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zainicjuj plany kont</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkExport}
              className='size-8'
              aria-label='Eksportuj dane zaznaczonych jednostek'
              title='Eksportuj dane zaznaczonych jednostek'
            >
              <Download />
              <span className='sr-only'>Eksportuj dane</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eksportuj dane</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Usuń zaznaczone jednostki'
              title='Usuń zaznaczone jednostki'
            >
              <Trash2 />
              <span className='sr-only'>Usuń jednostki</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usuń jednostki</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <BudgetUnitsMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}