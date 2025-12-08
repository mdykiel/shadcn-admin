import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { BudgetUnitMutateDrawer } from '@/components/layout/budget-unit-mutate-drawer'
import { useBudgetUnits } from './budget-units-provider'
import { useAuthStore } from '@/store/auth'
import { budgetUnitsService } from '@/services/budget-units'

export function BudgetUnitsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useBudgetUnits()
  const { loadUnits } = useAuthStore()

  const handleInitialize = async () => {
    if (!currentRow) return

    try {
      await budgetUnitsService.initialize(currentRow.id)
      toast.success(`Plan kont został zainicjowany dla jednostki: ${currentRow.name}`)
      setOpen(null)
      setCurrentRow(null)
    } catch (error: any) {
      console.error('Initialize error:', error)
      toast.error(error.message || 'Błąd podczas inicjalizacji planu kont')
    }
  }

  const handleDelete = async () => {
    if (!currentRow) return

    try {
      await budgetUnitsService.delete(currentRow.id)
      await loadUnits() // Reload units after deletion
      toast.success(`Jednostka "${currentRow.name}" została usunięta`)
      setOpen(null)
      setCurrentRow(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Błąd podczas usuwania jednostki')
    }
  }

  return (
    <>
      {/* Add/Edit Drawer */}
      <BudgetUnitMutateDrawer
        key={open === 'add' ? 'unit-create' : `unit-update-${currentRow?.id}`}
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        currentRow={open === 'edit' ? currentRow : undefined}
      />

      {/* Initialize Confirmation */}
      {currentRow && (
        <ConfirmDialog
          key='unit-initialize'
          open={open === 'initialize'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={handleInitialize}
          title={`Zainicjuj plan kont dla: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>
                Czy chcesz zainicjować wzorcowy plan kont księgowych dla tej jednostki?
              </p>
              <div className='text-sm bg-muted p-3 rounded-md'>
                <strong>Jednostka:</strong> {currentRow.name}
                {currentRow.shortName && (
                  <>
                    <br />
                    <strong>Skrót:</strong> {currentRow.shortName}
                  </>
                )}
                <br />
                <strong>Typ:</strong> {currentRow.unitType}
              </div>
              <p className='text-muted-foreground text-sm'>
                Zostanie utworzony standardowy plan kont zgodny z przepisami
                dla jednostek sektora finansów publicznych.
              </p>
            </div>
          }
          confirmText='Zainicjuj plan kont'
        />
      )}

      {/* Delete Confirmation */}
      {currentRow && (
        <ConfirmDialog
          key='unit-delete'
          destructive
          open={open === 'delete'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={handleDelete}
          className='max-w-md'
          title={`Usuń jednostkę: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>
                Czy na pewno chcesz usunąć tę jednostkę budżetową?
              </p>
              <div className='text-sm bg-muted p-3 rounded-md'>
                <strong>Jednostka:</strong> {currentRow.name}
                {currentRow.shortName && (
                  <>
                    <br />
                    <strong>Skrót:</strong> {currentRow.shortName}
                  </>
                )}
                <br />
                <strong>Typ:</strong> {currentRow.unitType}
              </div>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Ta operacja usunie wszystkie dane związane z jednostką,
                w tym plan kont, operacje gospodarcze i sprawozdania.
                Tej operacji nie można cofnąć.
              </p>
            </div>
          }
          confirmText='Usuń jednostkę'
        />
      )}
    </>
  )
}