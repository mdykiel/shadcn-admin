import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Eye, EyeOff, Download, FileSpreadsheet, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { Account } from '@/types/auth'
import { accountsService } from '@/services/accounts'
import { useAuthStore } from '@/store/auth'
import { useAccounts } from './accounts-provider'
import { AccountsMultiDeleteDialog } from './accounts-multi-delete-dialog'
import { AccountsCopyToJournalDialog } from './accounts-copy-to-journal-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCopyToJournal, setShowCopyToJournal] = useState(false)
  const { currentUnit } = useAuthStore()
  const { selectedJournalId, selectedFiscalPeriodId } = useAccounts()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkActivate = async () => {
    if (!currentUnit) return

    const selectedAccounts = selectedRows.map((row) => row.original as Account)
    const inactiveAccounts = selectedAccounts.filter(acc => !acc.isActive)

    if (inactiveAccounts.length === 0) {
      toast.error('Wszystkie zaznaczone konta są już aktywne')
      return
    }

    toast.promise(
      Promise.all(
        inactiveAccounts.map(account =>
          accountsService.toggleActive(currentUnit.id, account.id)
        )
      ),
      {
        loading: 'Aktywowanie kont...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Aktywowano ${inactiveAccounts.length} kont${inactiveAccounts.length === 1 ? 'o' : ''}`
        },
        error: 'Błąd podczas aktywowania kont',
      }
    )
  }

  const handleBulkDeactivate = async () => {
    if (!currentUnit) return

    const selectedAccounts = selectedRows.map((row) => row.original as Account)
    const activeAccounts = selectedAccounts.filter(acc => acc.isActive)

    if (activeAccounts.length === 0) {
      toast.error('Wszystkie zaznaczone konta są już nieaktywne')
      return
    }

    toast.promise(
      Promise.all(
        activeAccounts.map(account =>
          accountsService.toggleActive(currentUnit.id, account.id)
        )
      ),
      {
        loading: 'Dezaktywowanie kont...',
        success: () => {
          table.resetRowSelection()
          window.location.reload()
          return `Dezaktywowano ${activeAccounts.length} kont${activeAccounts.length === 1 ? 'o' : ''}`
        },
        error: 'Błąd podczas dezaktywowania kont',
      }
    )
  }

  const handleBulkExport = async () => {
    const selectedAccounts = selectedRows.map((row) => row.original as Account)

    toast.promise(sleep(1000), {
      loading: 'Eksportowanie planu kont...',
      success: () => {
        table.resetRowSelection()
        return `Wyeksportowano plan kont dla ${selectedAccounts.length} kont${selectedAccounts.length === 1 ? 'a' : ''}`
      },
      error: 'Błąd podczas eksportowania planu kont',
    })
  }

  const handleExportToExcel = async () => {
    const selectedAccounts = selectedRows.map((row) => row.original as Account)

    toast.promise(sleep(1500), {
      loading: 'Eksportowanie do Excel...',
      success: () => {
        table.resetRowSelection()
        return `Wyeksportowano ${selectedAccounts.length} kont${selectedAccounts.length === 1 ? 'o' : ''} do Excel`
      },
      error: 'Błąd podczas eksportowania do Excel',
    })
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='konto'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkActivate}
              className='size-8'
              aria-label='Aktywuj zaznaczone konta'
              title='Aktywuj zaznaczone konta'
            >
              <Eye />
              <span className='sr-only'>Aktywuj konta</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aktywuj konta</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkDeactivate}
              className='size-8'
              aria-label='Dezaktywuj zaznaczone konta'
              title='Dezaktywuj zaznaczone konta'
            >
              <EyeOff />
              <span className='sr-only'>Dezaktywuj konta</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dezaktywuj konta</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setShowCopyToJournal(true)}
              className='size-8'
              aria-label='Kopiuj do dziennika'
              title='Kopiuj do dziennika'
            >
              <Copy />
              <span className='sr-only'>Kopiuj do dziennika</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kopiuj do dziennika</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkExport}
              className='size-8'
              aria-label='Eksportuj plan kont'
              title='Eksportuj plan kont'
            >
              <Download />
              <span className='sr-only'>Eksportuj plan kont</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eksportuj plan kont</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleExportToExcel}
              className='size-8'
              aria-label='Eksportuj do Excel'
              title='Eksportuj do Excel'
            >
              <FileSpreadsheet />
              <span className='sr-only'>Eksportuj do Excel</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eksportuj do Excel</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Usuń zaznaczone konta'
              title='Usuń zaznaczone konta'
            >
              <Trash2 />
              <span className='sr-only'>Usuń konta</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usuń konta</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <AccountsMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />

      <AccountsCopyToJournalDialog
        table={table}
        open={showCopyToJournal}
        onOpenChange={setShowCopyToJournal}
        currentJournalId={selectedJournalId !== 'all' ? selectedJournalId : undefined}
        currentFiscalPeriodId={selectedFiscalPeriodId}
      />
    </>
  )
}