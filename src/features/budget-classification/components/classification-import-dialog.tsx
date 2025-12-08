import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClassificationType } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'

interface ClassificationImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClassificationImportDialog({
  open,
  onOpenChange,
}: ClassificationImportDialogProps) {
  const { currentUnit } = useAuthStore()
  const [type, setType] = useState<ClassificationType>('WYDATEK')
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    if (!currentUnit) return

    try {
      setIsLoading(true)
      const imported = await budgetClassificationService.importFromDictionary(currentUnit.id, type)
      toast.success(`Zaimportowano ${imported.length} klasyfikacji`)
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas importu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importuj klasyfikacje</DialogTitle>
          <DialogDescription>
            Zaimportuj podstawowe klasyfikacje budżetowe ze słownika.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Typ klasyfikacji do importu</label>
            <Select value={type} onValueChange={(v) => setType(v as ClassificationType)}>
              <SelectTrigger>
                <SelectValue placeholder='Wybierz typ' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='DOCHOD'>Dochody</SelectItem>
                <SelectItem value='WYDATEK'>Wydatki</SelectItem>
                <SelectItem value='PRZYCHOD'>Przychody</SelectItem>
                <SelectItem value='ROZCHOD'>Rozchody</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className='text-sm text-muted-foreground'>
            Zostaną zaimportowane podstawowe klasyfikacje budżetowe dla wybranego typu.
            Istniejące klasyfikacje nie zostaną nadpisane.
          </p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? 'Importowanie...' : 'Importuj'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

