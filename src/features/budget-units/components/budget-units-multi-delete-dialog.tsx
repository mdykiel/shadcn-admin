'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { BudgetUnit } from '@/types/auth'
import { budgetUnitsService } from '@/services/budget-units'
import { useAuthStore } from '@/store/auth'

type BudgetUnitsMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'USUŃ'

export function BudgetUnitsMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: BudgetUnitsMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const { loadUnits } = useAuthStore()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Wpisz "${CONFIRM_WORD}" aby potwierdzić.`)
      return
    }

    onOpenChange(false)

    const selectedUnits = selectedRows.map((row) => row.original as BudgetUnit)

    toast.promise(
      Promise.all(
        selectedUnits.map(unit => budgetUnitsService.delete(unit.id))
      ).then(() => loadUnits()),
      {
        loading: 'Usuwanie jednostek...',
        success: () => {
          table.resetRowSelection()
          setValue('')
          return `Usunięto ${selectedRows.length} jednostk${selectedRows.length === 1 ? 'ę' : selectedRows.length <= 4 ? 'i' : ''}`
        },
        error: 'Błąd podczas usuwania jednostek',
      }
    )
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setValue('')
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Usuń {selectedRows.length}{' '}
          jednostk{selectedRows.length === 1 ? 'ę' : selectedRows.length <= 4 ? 'i' : ''}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Czy na pewno chcesz usunąć zaznaczone jednostki budżetowe? <br />
            Ta operacja nie może być cofnięta.
          </p>

          <div className='text-sm bg-muted p-3 rounded-md'>
            <strong>Jednostki do usunięcia:</strong>
            <ul className='mt-2 space-y-1'>
              {selectedRows.slice(0, 5).map((row) => {
                const unit = row.original as BudgetUnit
                return (
                  <li key={unit.id} className='flex items-center gap-2'>
                    <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                    {unit.name} {unit.shortName && `(${unit.shortName})`}
                  </li>
                )
              })}
              {selectedRows.length > 5 && (
                <li className='text-muted-foreground'>
                  ... i {selectedRows.length - 5} więcej
                </li>
              )}
            </ul>
          </div>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Potwierdź wpisując "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Wpisz "${CONFIRM_WORD}" aby potwierdzić.`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Ostrzeżenie!</AlertTitle>
            <AlertDescription>
              Bądź ostrożny, tej operacji nie można cofnąć. Zostaną usunięte wszystkie dane związane z tymi jednostkami.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Usuń jednostki'
      destructive
    />
  )
}