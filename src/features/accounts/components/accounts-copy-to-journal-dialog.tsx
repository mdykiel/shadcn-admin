import { useState, useEffect } from 'react'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Account, Journal } from '@/types/auth'
import { accountsService } from '@/services/accounts'
import { journalService } from '@/services/journals'
import { fiscalPeriodService, FiscalPeriod } from '@/services/fiscal-periods'
import { useAuthStore } from '@/store/auth'

type AccountsCopyToJournalDialogProps<TData> = {
  table: Table<TData>
  open: boolean
  onOpenChange: (open: boolean) => void
  currentJournalId?: string
  currentFiscalPeriodId?: string
}

export function AccountsCopyToJournalDialog<TData>({
  table,
  open,
  onOpenChange,
  currentJournalId,
  currentFiscalPeriodId,
}: AccountsCopyToJournalDialogProps<TData>) {
  const [isCopying, setIsCopying] = useState(false)
  const [journals, setJournals] = useState<Journal[]>([])
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([])
  const [targetJournalId, setTargetJournalId] = useState<string>('')
  const [targetFiscalPeriodId, setTargetFiscalPeriodId] = useState<string>('')
  const { currentUnit } = useAuthStore()
  
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedAccounts = selectedRows.map((row) => row.original as Account)

  useEffect(() => {
    const loadData = async () => {
      if (!currentUnit || !open) return
      
      try {
        const [journalsList, periodsList] = await Promise.all([
          journalService.getActive(currentUnit.id),
          fiscalPeriodService.getAll(currentUnit.id),
        ])
        setJournals(journalsList)
        setFiscalPeriods(periodsList)
        
        // Set default fiscal period
        if (currentFiscalPeriodId) {
          setTargetFiscalPeriodId(currentFiscalPeriodId)
        } else {
          const activePeriod = periodsList.find(p => p.isActive)
          if (activePeriod) {
            setTargetFiscalPeriodId(activePeriod.id)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [currentUnit, open, currentFiscalPeriodId])

  const handleCopy = async () => {
    if (!currentUnit || !targetJournalId || !targetFiscalPeriodId || selectedAccounts.length === 0) {
      return
    }

    setIsCopying(true)

    try {
      const accountIds = selectedAccounts.map(account => account.id)
      const result = await accountsService.copyToJournal(
        currentUnit.id,
        accountIds,
        targetJournalId,
        targetFiscalPeriodId
      )

      toast.success(result.message)
      table.resetRowSelection()
      onOpenChange(false)
      setTargetJournalId('')
      window.location.reload()
    } catch (error: any) {
      console.error('Copy error:', error)
      toast.error(error.response?.data?.message || error.message || 'Błąd podczas kopiowania kont')
    } finally {
      setIsCopying(false)
    }
  }

  // Filter out current journal from options
  const availableJournals = journals.filter(j => j.id !== currentJournalId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Kopiuj konta do dziennika</DialogTitle>
          <DialogDescription>
            Skopiuj {selectedAccounts.length} zaznaczonych kont do wybranego dziennika.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>Dziennik docelowy</Label>
            <Select value={targetJournalId} onValueChange={setTargetJournalId}>
              <SelectTrigger>
                <SelectValue placeholder='Wybierz dziennik docelowy' />
              </SelectTrigger>
              <SelectContent>
                {availableJournals.map((journal) => (
                  <SelectItem key={journal.id} value={journal.id}>
                    {journal.shortName} - {journal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Okres obrachunkowy</Label>
            <Select value={targetFiscalPeriodId} onValueChange={setTargetFiscalPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder='Wybierz okres' />
              </SelectTrigger>
              <SelectContent>
                {fiscalPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name} {period.isActive && '(aktywny)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!targetJournalId || !targetFiscalPeriodId || isCopying}
          >
            {isCopying ? 'Kopiowanie...' : 'Kopiuj konta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

