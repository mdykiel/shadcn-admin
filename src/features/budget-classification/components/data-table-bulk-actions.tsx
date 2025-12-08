import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { BudgetClassification } from '@/types/auth'
import { budgetClassificationService } from '@/services/budget-classification'
import { useAuthStore } from '@/store/auth'
import { ConfirmDialog } from '@/components/confirm-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { currentUnit } = useAuthStore()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkActivate = async () => {
    if (!currentUnit) return

    const selectedItems = selectedRows.map((row) => row.original as BudgetClassification)
    const inactiveItems = selectedItems.filter(item => !item.isActive)

    if (inactiveItems.length === 0) {
      toast.error('Wszystkie zaznaczone klasyfikacje są już aktywne')
      return
    }

    toast.promise(
      Promise.all(
        inactiveItems.map(item =>
          budgetClassificationService.toggleActive(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Aktywowanie klasyfikacji...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Aktywowano ${inactiveItems.length} klasyfikacji`
        },
        error: 'Błąd podczas aktywowania klasyfikacji',
      }
    )
  }

  const handleBulkDeactivate = async () => {
    if (!currentUnit) return

    const selectedItems = selectedRows.map((row) => row.original as BudgetClassification)
    const activeItems = selectedItems.filter(item => item.isActive)

    if (activeItems.length === 0) {
      toast.error('Wszystkie zaznaczone klasyfikacje są już nieaktywne')
      return
    }

    toast.promise(
      Promise.all(
        activeItems.map(item =>
          budgetClassificationService.toggleActive(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Dezaktywowanie klasyfikacji...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Dezaktywowano ${activeItems.length} klasyfikacji`
        },
        error: 'Błąd podczas dezaktywowania klasyfikacji',
      }
    )
  }

  const handleBulkDelete = async () => {
    if (!currentUnit) return

    const selectedItems = selectedRows.map((row) => row.original as BudgetClassification)

    toast.promise(
      Promise.all(
        selectedItems.map(item =>
          budgetClassificationService.delete(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Usuwanie klasyfikacji...',
        success: () => {
          table.resetRowSelection()
          setShowDeleteConfirm(false)
          window.location.reload()
          return `Usunięto ${selectedItems.length} klasyfikacji`
        },
        error: 'Błąd podczas usuwania klasyfikacji',
      }
    )
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='klasyfikacja'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={handleBulkActivate} className='size-8'>
              <Eye />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Aktywuj klasyfikacje</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={handleBulkDeactivate} className='size-8'>
              <EyeOff />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Dezaktywuj klasyfikacje</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='destructive' size='icon' onClick={() => setShowDeleteConfirm(true)} className='size-8'>
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Usuń klasyfikacje</p></TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        handleConfirm={handleBulkDelete}
        title='Usuń zaznaczone klasyfikacje'
        desc={`Czy na pewno chcesz usunąć ${selectedRows.length} zaznaczonych klasyfikacji? Tej operacji nie można cofnąć.`}
        confirmText='Usuń'
        destructive
      />
    </>
  )
}

