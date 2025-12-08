import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FiscalPeriodMutateDrawer } from './fiscal-period-mutate-drawer'
import { useFiscalPeriods } from './fiscal-periods-provider'
import { fiscalPeriodService } from '@/services/fiscal-periods'

export function FiscalPeriodsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useFiscalPeriods()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fiscalPeriodService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      toast.success('Okres usunięty')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Błąd podczas usuwania')
    },
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => fiscalPeriodService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      toast.success('Okres zamknięty')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Błąd podczas zamykania okresu')
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => fiscalPeriodService.setActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      toast.success('Okres ustawiony jako aktywny')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Błąd podczas aktywacji okresu')
    },
  })

  return (
    <>
      {/* Add/Edit Drawer */}
      <FiscalPeriodMutateDrawer
        key={open === 'add' ? 'period-create' : `period-update-${currentRow?.id}`}
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        currentRow={open === 'edit' ? currentRow : undefined}
      />

      {/* Activate Dialog */}
      {currentRow && (
        <ConfirmDialog
          open={open === 'activate'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={() => activateMutation.mutate(currentRow.id)}
          title={`Aktywuj okres: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>Czy chcesz ustawić ten okres jako aktywny?</p>
              <p className='text-sm text-muted-foreground'>
                Poprzedni aktywny okres zostanie dezaktywowany.
                Nowe operacje będą przypisywane do tego okresu.
              </p>
            </div>
          }
          confirmText='Aktywuj'
        />
      )}

      {/* Close Dialog */}
      {currentRow && (
        <ConfirmDialog
          open={open === 'close'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={() => closeMutation.mutate(currentRow.id)}
          title={`Zamknij okres: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>Czy na pewno chcesz zamknąć ten okres obrachunkowy?</p>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Zamknięcie okresu jest nieodwracalne.
                Po zamknięciu nie będzie można dodawać ani edytować operacji w tym okresie.
              </p>
            </div>
          }
          confirmText='Zamknij okres'
          destructive
        />
      )}

      {/* Delete Dialog */}
      {currentRow && (
        <ConfirmDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={() => deleteMutation.mutate(currentRow.id)}
          title={`Usuń okres: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>Czy na pewno chcesz usunąć ten okres obrachunkowy?</p>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Można usunąć tylko okres bez powiązanych kont i operacji.
              </p>
            </div>
          }
          confirmText='Usuń okres'
          destructive
        />
      )}
    </>
  )
}

