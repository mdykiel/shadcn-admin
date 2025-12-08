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
import { Journal } from '@/types/auth'
import { journalService } from '@/services/journals'
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

    const selectedItems = selectedRows.map((row) => row.original as Journal)
    const inactiveItems = selectedItems.filter(item => !item.isActive)

    if (inactiveItems.length === 0) {
      toast.error('Wszystkie zaznaczone dzienniki są już aktywne')
      return
    }

    toast.promise(
      Promise.all(
        inactiveItems.map(item =>
          journalService.toggleActive(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Aktywowanie dzienników...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Aktywowano ${inactiveItems.length} dzienników`
        },
        error: 'Błąd podczas aktywowania dzienników',
      }
    )
  }

  const handleBulkDeactivate = async () => {
    if (!currentUnit) return

    const selectedItems = selectedRows.map((row) => row.original as Journal)
    const activeItems = selectedItems.filter(item => item.isActive)

    if (activeItems.length === 0) {
      toast.error('Wszystkie zaznaczone dzienniki są już nieaktywne')
      return
    }

    toast.promise(
      Promise.all(
        activeItems.map(item =>
          journalService.toggleActive(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Dezaktywowanie dzienników...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Dezaktywowano ${activeItems.length} dzienników`
        },
        error: 'Błąd podczas dezaktywowania dzienników',
      }
    )
  }

  const handleBulkDelete = async () => {
    if (!currentUnit) return

    const selectedItems = selectedRows.map((row) => row.original as Journal)

    toast.promise(
      Promise.all(
        selectedItems.map(item =>
          journalService.delete(currentUnit.id, item.id)
        )
      ),
      {
        loading: 'Usuwanie dzienników...',
        success: () => {
          table.resetRowSelection()
          setShowDeleteConfirm(false)
          window.location.reload()
          return `Usunięto ${selectedItems.length} dzienników`
        },
        error: 'Błąd podczas usuwania dzienników',
      }
    )
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='dziennik'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={handleBulkActivate} className='size-8'>
              <Eye />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Aktywuj dzienniki</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={handleBulkDeactivate} className='size-8'>
              <EyeOff />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Dezaktywuj dzienniki</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='destructive' size='icon' onClick={() => setShowDeleteConfirm(true)} className='size-8'>
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Usuń dzienniki</p></TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        handleConfirm={handleBulkDelete}
        title='Usuń zaznaczone dzienniki'
        desc={`Czy na pewno chcesz usunąć ${selectedRows.length} zaznaczonych dzienników? Tej operacji nie można cofnąć.`}
        confirmText='Usuń'
        destructive
      />
    </>
  )
}

