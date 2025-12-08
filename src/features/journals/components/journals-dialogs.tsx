import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAuthStore } from '@/store/auth'
import { journalService } from '@/services/journals'
import { useJournals } from './journals-provider'
import { JournalsMutateDrawer } from './journals-mutate-drawer'

export function JournalsDialogs() {
  const { currentUnit } = useAuthStore()
  const { open, setOpen, currentRow, setCurrentRow } = useJournals()

  const handleDelete = async () => {
    if (!currentUnit || !currentRow) return

    try {
      await journalService.delete(currentUnit.id, currentRow.id)
      toast.success('Dziennik został usunięty')
      setOpen(null)
      setCurrentRow(null)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Wystąpił błąd podczas usuwania')
    }
  }

  return (
    <>
      {/* Add/Edit Drawer */}
      <JournalsMutateDrawer
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? open : null)
          if (!isOpen) {
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        currentRow={open === 'edit' ? currentRow : null}
      />

      {/* Delete Confirmation Dialog */}
      {currentRow && (
        <ConfirmDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => {
            setOpen(isOpen ? 'delete' : null)
            if (!isOpen) {
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          handleConfirm={handleDelete}
          className='max-w-md'
          title={`Usuń dziennik`}
          desc={
            <div className='space-y-2'>
              <p>Czy na pewno chcesz usunąć ten dziennik?</p>
              <div className='text-sm bg-muted p-3 rounded-md'>
                <strong>Dziennik:</strong> {currentRow.name} ({currentRow.shortName})
                <br />
                <strong>Typ:</strong> {currentRow.type}
              </div>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Ta operacja usunie dziennik wraz z wszystkimi powiązanymi danymi. Tej operacji nie można cofnąć.
              </p>
            </div>
          }
          confirmText='Usuń'
          destructive
        />
      )}
    </>
  )
}

