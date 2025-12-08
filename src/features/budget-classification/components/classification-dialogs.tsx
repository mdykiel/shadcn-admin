import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ClassificationMutateDrawer } from './classification-mutate-drawer'
import { ClassificationImportDialog } from './classification-import-dialog'
import { useClassification } from './classification-provider'
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'

export function ClassificationDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedJournalId } = useClassification()
  const { currentUnit } = useAuthStore()

  const handleDelete = async () => {
    if (!currentRow || !currentUnit) return

    try {
      await budgetClassificationService.delete(currentUnit.id, currentRow.id)
      toast.success(`Klasyfikacja "${currentRow.name}" została usunięta`)
      setOpen(null)
      setCurrentRow(null)
      window.location.reload()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Błąd podczas usuwania klasyfikacji')
    }
  }

  return (
    <>
      {/* Add/Edit Drawer */}
      <ClassificationMutateDrawer
        key={open === 'add' ? 'classification-create' : `classification-update-${currentRow?.id}`}
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        currentRow={open === 'edit' ? currentRow : undefined}
        defaultJournalId={selectedJournalId !== 'all' ? selectedJournalId : undefined}
      />

      {/* Import Dialog */}
      <ClassificationImportDialog
        open={open === 'import'}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />

      {/* Delete Confirmation */}
      {currentRow && (
        <ConfirmDialog
          key='classification-delete'
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
          title={`Usuń klasyfikację`}
          desc={
            <div className='space-y-2'>
              <p>Czy na pewno chcesz usunąć tę klasyfikację budżetową?</p>
              <div className='text-sm bg-muted p-3 rounded-md'>
                <strong>Klasyfikacja:</strong> {currentRow.dzial}.{currentRow.rozdzial}.{currentRow.paragraf}
                {currentRow.podparagraf && `.${currentRow.podparagraf}`}
                <br />
                <strong>Nazwa:</strong> {currentRow.name}
                <br />
                <strong>Typ:</strong> {currentRow.type}
              </div>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Ta operacja usunie klasyfikację. Tej operacji nie można cofnąć.
              </p>
            </div>
          }
          confirmText='Usuń klasyfikację'
        />
      )}
    </>
  )
}

