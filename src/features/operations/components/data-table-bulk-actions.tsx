import { useState, useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, BookCheck, BookX, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Operation } from '@/types/auth'
import { operationsService } from '@/services/operations'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
  onRefresh: () => void
}

export function DataTableBulkActions<TData>({
  table,
  onRefresh,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedRows = table.getFilteredSelectedRowModel().rows

  // Calculate which operations can be deleted/decreed/posted/unposted
  const operationStats = useMemo(() => {
    const operations = selectedRows.map((row) => row.original as Operation)
    return {
      deletable: operations.filter(op => op.status === 'WPROWADZONE' || op.status === 'ZADEKRETOWANE'),
      decreeable: operations.filter(op => op.status === 'WPROWADZONE'),
      postable: operations.filter(op => op.status === 'ZADEKRETOWANE'),
      unpostable: operations.filter(op => op.status === 'ZAKSIEGOWANE'),
    }
  }, [selectedRows])

  const handleBulkDelete = async () => {
    if (operationStats.deletable.length === 0) return

    setIsDeleting(true)
    try {
      await Promise.all(
        operationStats.deletable.map(op => operationsService.delete(op.id))
      )
      toast.success(`Usunięto ${operationStats.deletable.length} operacji`)
      table.resetRowSelection()
      setShowDeleteConfirm(false)
      onRefresh()
    } catch {
      toast.error('Błąd podczas usuwania operacji')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDecree = async () => {
    if (operationStats.decreeable.length === 0) {
      toast.error('Brak operacji do zadekretowania')
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errors: string[] = []

    for (const op of operationStats.decreeable) {
      try {
        await operationsService.updateStatus(op.id, 'ZADEKRETOWANE')
        successCount++
      } catch (error: any) {
        const msg = error.response?.data?.error || 'Błąd walidacji'
        errors.push(`${op.documentNumber}: ${msg}`)
      }
    }

    if (successCount > 0) {
      toast.success(`Zadekretowano ${successCount} operacji`)
    }
    if (errors.length > 0) {
      toast.error(`Nie udało się zadekretować ${errors.length} operacji`, {
        description: errors.slice(0, 3).join('\n'),
      })
    }
    table.resetRowSelection()
    onRefresh()
    setIsProcessing(false)
  }

  const handleBulkPost = async () => {
    if (operationStats.postable.length === 0) {
      toast.error('Brak operacji do zaksięgowania')
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errors: string[] = []

    for (const op of operationStats.postable) {
      try {
        await operationsService.updateStatus(op.id, 'ZAKSIEGOWANE')
        successCount++
      } catch (error: any) {
        const msg = error.response?.data?.error || 'Błąd walidacji'
        errors.push(`${op.documentNumber}: ${msg}`)
      }
    }

    if (successCount > 0) {
      toast.success(`Zaksięgowano ${successCount} operacji`)
    }
    if (errors.length > 0) {
      toast.error(`Nie udało się zaksięgować ${errors.length} operacji`, {
        description: errors.slice(0, 3).join('\n'),
      })
    }
    table.resetRowSelection()
    onRefresh()
    setIsProcessing(false)
  }

  const handleBulkUnpost = async () => {
    if (operationStats.unpostable.length === 0) {
      toast.error('Brak operacji do odksięgowania')
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errors: string[] = []

    for (const op of operationStats.unpostable) {
      try {
        await operationsService.updateStatus(op.id, 'ZADEKRETOWANE')
        successCount++
      } catch (error: any) {
        const msg = error.response?.data?.error || 'Błąd walidacji'
        errors.push(`${op.documentNumber}: ${msg}`)
      }
    }

    if (successCount > 0) {
      toast.success(`Odksięgowano ${successCount} operacji`)
    }
    if (errors.length > 0) {
      toast.error(`Nie udało się odksięgować ${errors.length} operacji`, {
        description: errors.slice(0, 3).join('\n'),
      })
    }
    table.resetRowSelection()
    onRefresh()
    setIsProcessing(false)
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='operacja'>
        {operationStats.decreeable.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={handleBulkDecree}
                disabled={isProcessing}
                className='size-8'
                aria-label='Zadekretuj zaznaczone'
              >
                <FileCheck />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zadekretuj ({operationStats.decreeable.length})</p>
            </TooltipContent>
          </Tooltip>
        )}

        {operationStats.postable.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={handleBulkPost}
                disabled={isProcessing}
                className='size-8'
                aria-label='Zaksięguj zaznaczone'
              >
                <BookCheck />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zaksięguj ({operationStats.postable.length})</p>
            </TooltipContent>
          </Tooltip>
        )}

        {operationStats.unpostable.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={handleBulkUnpost}
                disabled={isProcessing}
                className='size-8'
                aria-label='Odksięguj zaznaczone'
              >
                <BookX />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Odksięguj ({operationStats.unpostable.length})</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              disabled={operationStats.deletable.length === 0}
              className='size-8'
              aria-label='Usuń zaznaczone'
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usuń ({operationStats.deletable.length})</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title='Usuń zaznaczone operacje'
        desc={`Czy na pewno chcesz usunąć ${operationStats.deletable.length} operacji? Ta akcja jest nieodwracalna.${
          operationStats.deletable.length < selectedRows.length 
            ? ` (${selectedRows.length - operationStats.deletable.length} zaksięgowanych zostanie pominiętych)`
            : ''
        }`}
        confirmText={isDeleting ? 'Usuwanie...' : 'Usuń'}
        cancelBtnText='Anuluj'
        handleConfirm={handleBulkDelete}
        destructive
      />
    </>
  )
}

