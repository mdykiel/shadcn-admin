'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAuthStore } from '@/stores/auth-store'
import { rolesService } from '@/services/roles'
import { type Role } from '../data/schema'

type RolesDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RolesDeleteDialogProps) {
  const { currentUnit } = useAuthStore()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => rolesService.delete(currentUnit!.id, currentRow.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', currentUnit?.id] })
      toast.success('Rola została usunięta')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas usuwania roli')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={deleteMutation.isPending || currentRow.isSystem}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Usuń rolę
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Czy na pewno chcesz usunąć rolę{' '}
            <span className='font-bold'>{currentRow.name}</span>?
          </p>

          {currentRow._count?.users && currentRow._count.users > 0 && (
            <Alert variant='destructive'>
              <AlertTitle>Uwaga!</AlertTitle>
              <AlertDescription>
                Ta rola jest przypisana do {currentRow._count.users} użytkowników.
                Po usunięciu stracą oni te uprawnienia.
              </AlertDescription>
            </Alert>
          )}

          {currentRow.isSystem && (
            <Alert variant='destructive'>
              <AlertTitle>Nie można usunąć!</AlertTitle>
              <AlertDescription>
                Role systemowe nie mogą być usunięte.
              </AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText={
        deleteMutation.isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Usuwanie...
          </>
        ) : (
          'Usuń'
        )
      }
      destructive
    />
  )
}

