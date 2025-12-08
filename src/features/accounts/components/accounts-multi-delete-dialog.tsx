import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Account } from '@/types/auth'
import { accountsService } from '@/services/accounts'
import { useAuthStore } from '@/store/auth'

type AccountsMultiDeleteDialogProps<TData> = {
  table: Table<TData>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountsMultiDeleteDialog<TData>({
  table,
  open,
  onOpenChange,
}: AccountsMultiDeleteDialogProps<TData>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { currentUnit } = useAuthStore()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedAccounts = selectedRows.map((row) => row.original as Account)

  const handleConfirm = async () => {
    if (!currentUnit || selectedAccounts.length === 0) return

    setIsDeleting(true)

    try {
      const ids = selectedAccounts.map(account => account.id)
      const result = await accountsService.deleteMany(currentUnit.id, ids)

      toast.success(result.message)

      table.resetRowSelection()
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(error.response?.data?.message || error.message || 'Błąd podczas usuwania kont')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleConfirm}
      destructive
      disabled={isDeleting}
      title={`Usuń ${selectedAccounts.length} ${selectedAccounts.length === 1 ? 'konto' : 'kont'}`}
      desc={
        <div className='space-y-3'>
          <p>
            Czy na pewno chcesz usunąć{' '}
            <strong>
              {selectedAccounts.length} {selectedAccounts.length === 1 ? 'konto' : 'kont'}
            </strong>
            ?
          </p>

          {selectedAccounts.length <= 5 ? (
            <div className='text-sm bg-muted p-3 rounded-md'>
              <strong>Konta do usunięcia:</strong>
              <ul className='mt-2 space-y-1'>
                {selectedAccounts.map((account) => (
                  <li key={account.id}>
                    • {account.number} - {account.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className='text-sm bg-muted p-3 rounded-md'>
              <strong>Przykładowe konta do usunięcia:</strong>
              <ul className='mt-2 space-y-1'>
                {selectedAccounts.slice(0, 3).map((account) => (
                  <li key={account.id}>
                    • {account.number} - {account.name}
                  </li>
                ))}
                <li>... i {selectedAccounts.length - 3} więcej</li>
              </ul>
            </div>
          )}

          <p className='text-destructive text-sm'>
            <strong>Uwaga:</strong> Ta operacja usunie wszystkie zaznaczone konta wraz z
            powiązanymi zapisami księgowymi. Tej operacji nie można cofnąć.
          </p>
        </div>
      }
      confirmText={isDeleting ? 'Usuwanie...' : 'Usuń konta'}
    />
  )
}