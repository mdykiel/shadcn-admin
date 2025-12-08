import { toast } from 'sonner'
import { useOperations } from './operations-provider'
import { OperationViewDialog } from './operation-view-dialog'
import { OperationMutateDrawer } from './operation-mutate-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { operationsService } from '@/services/operations'

interface OperationsDialogsProps {
  onRefresh: () => void
}

export function OperationsDialogs({ onRefresh }: OperationsDialogsProps) {
  const { open, setOpen, currentRow, setCurrentRow } = useOperations()

  const handleClose = () => {
    setOpen(null)
    setCurrentRow(null)
  }

  const handleDelete = async () => {
    if (!currentRow) return
    try {
      await operationsService.delete(currentRow.id)
      toast.success('Operacja została usunięta.')
      onRefresh()
      handleClose()
    } catch (error) {
      toast.error('Nie udało się usunąć operacji.')
    }
  }

  const handleDecree = async () => {
    if (!currentRow) return
    try {
      await operationsService.updateStatus(currentRow.id, 'ZADEKRETOWANE')
      toast.success('Operacja została zadekretowana.')
      onRefresh()
      handleClose()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Nie udało się zadekretować operacji.'
      toast.error(message)
    }
  }

  const handlePost = async () => {
    if (!currentRow) return
    try {
      await operationsService.updateStatus(currentRow.id, 'ZAKSIEGOWANE')
      toast.success('Operacja została zaksięgowana.')
      onRefresh()
      handleClose()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Nie udało się zaksięgować operacji.'
      toast.error(message)
    }
  }

  const handleUnpost = async () => {
    if (!currentRow) return
    try {
      await operationsService.updateStatus(currentRow.id, 'ZADEKRETOWANE')
      toast.success('Operacja została odksięgowana.')
      onRefresh()
      handleClose()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Nie udało się odksięgować operacji.'
      toast.error(message)
    }
  }

  return (
    <>
      <OperationMutateDrawer
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        currentRow={open === 'edit' ? currentRow : null}
        onSuccess={() => {
          onRefresh()
          handleClose()
        }}
      />

      <OperationViewDialog
        open={open === 'view'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        operation={currentRow}
      />

      <ConfirmDialog
        open={open === 'delete'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        title="Usuń operację"
        desc={`Czy na pewno chcesz usunąć operację "${currentRow?.documentNumber}"? Ta akcja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelBtnText="Anuluj"
        handleConfirm={handleDelete}
        destructive
      />

      <ConfirmDialog
        open={open === 'decree'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        title="Zadekretuj operację"
        desc={`Czy na pewno chcesz zadekretować operację "${currentRow?.documentNumber}"? Po zadekretowaniu operacja będzie gotowa do zaksięgowania.`}
        confirmText="Zadekretuj"
        cancelBtnText="Anuluj"
        handleConfirm={handleDecree}
      />

      <ConfirmDialog
        open={open === 'post'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        title="Zaksięguj operację"
        desc={`Czy na pewno chcesz zaksięgować operację "${currentRow?.documentNumber}"? Po zaksięgowaniu operacja nie będzie mogła być edytowana.`}
        confirmText="Zaksięguj"
        cancelBtnText="Anuluj"
        handleConfirm={handlePost}
      />

      <ConfirmDialog
        open={open === 'unpost'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        title="Odksięguj operację"
        desc={`Czy na pewno chcesz odksięgować operację "${currentRow?.documentNumber}"? Operacja wróci do statusu "Zadekretowane" i będzie można ją ponownie edytować.`}
        confirmText="Odksięguj"
        cancelBtnText="Anuluj"
        handleConfirm={handleUnpost}
      />
    </>
  )
}

