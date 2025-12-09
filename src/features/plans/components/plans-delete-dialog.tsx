import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type Plan } from './plans-provider'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
  onSuccess?: () => void
}

export function PlansDeleteDialog({ open, onOpenChange, plan, onSuccess }: Props) {
  const { token } = useAuthStore()

  const handleDelete = async () => {
    if (!plan || !token) return

    try {
      const res = await fetch(`${API_URL}/plans/${plan.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd usuwania planu')
      }

      toast.success('Plan usunięty')
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Błąd usuwania planu')
    }
  }

  if (!plan) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć plan?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Plan "{plan.name || `Plan ${plan.year}`}" 
            wraz z wszystkimi pozycjami zostanie trwale usunięty.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

