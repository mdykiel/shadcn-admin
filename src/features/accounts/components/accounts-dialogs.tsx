import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { AccountMutateDrawer } from './account-mutate-drawer'
import { useAccounts } from './accounts-provider'
import { useAuthStore } from '@/store/auth'
import { accountsService } from '@/services/accounts'
import { fiscalPeriodService, FiscalPeriod } from '@/services/fiscal-periods'

type UnitType = 'JST' | 'JEDNOSTKA_BUDZETOWA' | 'ZAKLAD_BUDZETOWY';

const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'JEDNOSTKA_BUDZETOWA', label: 'Jednostka budżetowa' },
  { value: 'ZAKLAD_BUDZETOWY', label: 'Samorządowy zakład budżetowy' },
  { value: 'JST', label: 'JST - Budżet organu' },
];

export function AccountsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedJournalId, selectedFiscalPeriodId } = useAccounts()
  const { currentUnit } = useAuthStore()

  // State for copy dialog
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([])
  const [sourcePeriodId, setSourcePeriodId] = useState<string>('')
  const [isCopying, setIsCopying] = useState(false)

  // State for initialize from template dialog
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('JEDNOSTKA_BUDZETOWA')
  const [isInitializing, setIsInitializing] = useState(false)

  // Load fiscal periods when copy dialog opens
  useEffect(() => {
    const loadPeriods = async () => {
      if (open === 'copyToPeriod' && currentUnit) {
        try {
          const periods = await fiscalPeriodService.getAll(currentUnit.id)
          // Filter out the current target period
          const availablePeriods = periods.filter(p => p.id !== selectedFiscalPeriodId)
          setFiscalPeriods(availablePeriods)
          // Pre-select first available period
          if (availablePeriods.length > 0 && !sourcePeriodId) {
            setSourcePeriodId(availablePeriods[0].id)
          }
        } catch (error) {
          console.error('Error loading fiscal periods:', error)
        }
      }
    }
    loadPeriods()
  }, [open, currentUnit, selectedFiscalPeriodId, sourcePeriodId])

  const handleDelete = async () => {
    if (!currentRow || !currentUnit) return

    try {
      await accountsService.delete(currentUnit.id, currentRow.id)
      toast.success(`Konto "${currentRow.name}" zostało usunięte`)
      setOpen(null)
      setCurrentRow(null)
      // In a real app, you'd refresh the data here
      window.location.reload()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Błąd podczas usuwania konta')
    }
  }

  const handleCopyAccounts = async () => {
    if (!currentUnit || !sourcePeriodId || !selectedFiscalPeriodId) return

    try {
      setIsCopying(true)
      const journalId = selectedJournalId !== 'all' ? selectedJournalId : undefined
      const result = await accountsService.copyToFiscalPeriod(
        currentUnit.id,
        sourcePeriodId,
        selectedFiscalPeriodId,
        journalId
      )
      toast.success(result.message)
      setOpen(null)
      setSourcePeriodId('')
      window.location.reload()
    } catch (error: any) {
      console.error('Copy error:', error)
      toast.error(error.response?.data?.message || error.message || 'Błąd podczas kopiowania planu kont')
    } finally {
      setIsCopying(false)
    }
  }

  const handleInitializeFromTemplate = async () => {
    if (!currentUnit || !selectedFiscalPeriodId || selectedJournalId === 'all') {
      toast.error('Wybierz dziennik i okres obrachunkowy')
      return
    }

    try {
      setIsInitializing(true)
      const result = await accountsService.initializeFromTemplate(
        currentUnit.id,
        selectedJournalId,
        selectedFiscalPeriodId,
        selectedUnitType
      )
      toast.success(result.message)
      setOpen(null)
      window.location.reload()
    } catch (error: any) {
      console.error('Initialize error:', error)
      toast.error(error.response?.data?.message || error.message || 'Błąd podczas inicjalizacji planu kont')
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <>
      {/* Add/Edit/Add Analytical Drawer */}
      <AccountMutateDrawer
        key={open === 'add' ? 'account-create' : open === 'addAnalytical' ? `account-analytical-${currentRow?.id}` : `account-update-${currentRow?.id}`}
        open={open === 'add' || open === 'edit' || open === 'addAnalytical'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        currentRow={open === 'edit' ? currentRow : undefined}
        defaultJournalId={selectedJournalId !== 'all' ? selectedJournalId : undefined}
        defaultFiscalPeriodId={selectedFiscalPeriodId}
        mode={open === 'edit' ? 'edit' : open === 'addAnalytical' ? 'addAnalytical' : 'add'}
        parentAccount={open === 'addAnalytical' ? currentRow ?? undefined : undefined}
      />

      {/* Delete Confirmation */}
      {currentRow && (
        <ConfirmDialog
          key='account-delete'
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
          title={`Usuń konto: ${currentRow.name}`}
          desc={
            <div className='space-y-2'>
              <p>
                Czy na pewno chcesz usunąć to konto księgowe?
              </p>
              <div className='text-sm bg-muted p-3 rounded-md'>
                <strong>Konto:</strong> {currentRow.number} - {currentRow.name}
                <br />
                <strong>Typ:</strong> {currentRow.accountType}
                <br />
                <strong>Zespół:</strong> {currentRow.zespol}
              </div>
              <p className='text-destructive text-sm'>
                <strong>Uwaga:</strong> Ta operacja usunie konto wraz ze wszystkimi powiązanymi
                zapisami księgowymi. Tej operacji nie można cofnąć.
              </p>
            </div>
          }
          confirmText='Usuń konto'
        />
      )}

      {/* Copy Accounts Dialog */}
      <Dialog
        open={open === 'copyToPeriod'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setSourcePeriodId('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Kopiuj plan kont</DialogTitle>
            <DialogDescription>
              Skopiuj plan kont z wybranego okresu obrachunkowego do bieżącego okresu.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Okres źródłowy (z którego kopiować)</Label>
              <Select value={sourcePeriodId} onValueChange={setSourcePeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder='Wybierz okres źródłowy' />
                </SelectTrigger>
                <SelectContent>
                  {fiscalPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='text-sm text-muted-foreground bg-muted p-3 rounded-md'>
              <p>
                <strong>Uwaga:</strong> Zostaną skopiowane wszystkie konta z wybranego okresu.
                Hierarchia kont (konta nadrzędne i podrzędne) zostanie zachowana.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setOpen(null)
                setSourcePeriodId('')
              }}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleCopyAccounts}
              disabled={!sourcePeriodId || isCopying}
            >
              {isCopying ? 'Kopiowanie...' : 'Kopiuj plan kont'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initialize from Template Dialog */}
      <Dialog
        open={open === 'initializeFromTemplate'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Inicjalizuj plan kont z szablonu</DialogTitle>
            <DialogDescription>
              Utwórz plan kont na podstawie wzorcowego planu zgodnego z Rozporządzeniem Ministra Finansów.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Typ jednostki</Label>
              <Select value={selectedUnitType} onValueChange={(v) => setSelectedUnitType(v as UnitType)}>
                <SelectTrigger>
                  <SelectValue placeholder='Wybierz typ jednostki' />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-2'>
              <p><strong>Szablony planów kont:</strong></p>
              <ul className='list-disc list-inside space-y-1'>
                <li><strong>Jednostka budżetowa</strong> - pełny plan kont (zespoły 0-8) zgodny z Załącznikiem nr 3</li>
                <li><strong>Zakład budżetowy</strong> - plan kont dla samorządowych zakładów budżetowych</li>
                <li><strong>JST - Budżet organu</strong> - plan kont budżetu (zespoły 1,2,9) zgodny z Załącznikiem nr 2</li>
              </ul>
            </div>

            {selectedJournalId === 'all' && (
              <div className='text-sm text-destructive bg-destructive/10 p-3 rounded-md'>
                <strong>Uwaga:</strong> Wybierz konkretny dziennik przed inicjalizacją planu kont.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(null)}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleInitializeFromTemplate}
              disabled={isInitializing || selectedJournalId === 'all'}
            >
              {isInitializing ? 'Tworzenie...' : 'Utwórz plan kont'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}