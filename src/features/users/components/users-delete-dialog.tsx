'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAuthStore } from '@/stores/auth-store'
import { usersService } from '@/services/users'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { currentUnit } = useAuthStore()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => usersService.removeFromUnit(currentUnit!.id, currentRow.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUnit?.id] })
      toast.success('Użytkownik został usunięty z jednostki')
      setValue('')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas usuwania użytkownika')
    },
  })

  const handleDelete = () => {
    if (value.trim() !== currentRow.email) return
    deleteMutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) setValue('')
        onOpenChange(state)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.email || deleteMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Usuń użytkownika
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Czy na pewno chcesz usunąć użytkownika{' '}
            <span className='font-bold'>{currentRow.name}</span>?
            <br />
            Ta akcja usunie użytkownika z jednostki. Nie będzie miał dostępu do danych tej jednostki.
          </p>

          <Label className='my-2'>
            Wpisz email użytkownika aby potwierdzić:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={currentRow.email}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Uwaga!</AlertTitle>
            <AlertDescription>
              Użytkownik straci dostęp do tej jednostki budżetowej.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteMutation.isPending ? <><Loader2 className='mr-2 h-4 w-4 animate-spin' /> Usuwanie...</> : 'Usuń'}
      destructive
    />
  )
}
