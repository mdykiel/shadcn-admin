import { useMemo } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Pencil, Trash2, FileCheck, BookCheck, BookX, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Operation } from '@/types/auth'
import { useOperations } from './operations-provider'

interface DataTableRowActionsProps {
  row: Row<Operation>
}

// Helper function to check if operation is ready for decree/booking
function checkOperationReadiness(operation: Operation) {
  const hasBookingDate = !!operation.bookingDate
  const hasEntries = operation.entries && operation.entries.length > 0

  if (!hasEntries) {
    return {
      isBalanced: false,
      isFullyDecreeed: false,
      hasBookingDate,
      totalDebit: 0,
      totalCredit: 0,
      entriesSum: 0,
      documentAmount: operation.totalAmount || 0,
      hasEntries: false
    }
  }

  let totalDebit = 0
  let totalCredit = 0
  let entriesSum = 0

  operation.entries.forEach(entry => {
    // Konwertuj amount do number (może być string z API)
    const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : (entry.amount || 0)
    entriesSum += amount
    if (entry.debitAccountId) {
      totalDebit += amount
    }
    if (entry.creditAccountId) {
      totalCredit += amount
    }
  })

  // Round to 2 decimal places
  totalDebit = Math.round(totalDebit * 100) / 100
  totalCredit = Math.round(totalCredit * 100) / 100
  entriesSum = Math.round(entriesSum * 100) / 100
  // Konwertuj totalAmount do number (może być string z API)
  const rawDocumentAmount = typeof operation.totalAmount === 'string'
    ? parseFloat(operation.totalAmount)
    : (operation.totalAmount || 0)
  const documentAmount = Math.round(rawDocumentAmount * 100) / 100

  return {
    isBalanced: totalDebit === totalCredit && totalDebit > 0,
    isFullyDecreeed: entriesSum === documentAmount,
    hasBookingDate,
    totalDebit,
    totalCredit,
    entriesSum,
    documentAmount,
    hasEntries: true,
  }
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useOperations()
  const operation = row.original
  const canEdit = operation.status === 'WPROWADZONE' || operation.status === 'ZADEKRETOWANE'
  const canDecree = operation.status === 'WPROWADZONE'
  const canPost = operation.status === 'ZADEKRETOWANE'
  const canUnpost = operation.status === 'ZAKSIEGOWANE'
  const canDelete = operation.status === 'WPROWADZONE' || operation.status === 'ZADEKRETOWANE'

  // Check readiness for status changes
  // Walidacja: data księgowania + Wn = Ma (zbilansowany)
  // Nie sprawdzamy już isFullyDecreeed bo przy BO/częściowej dekretacji nie musi być równe totalAmount
  const readinessInfo = useMemo(() => checkOperationReadiness(operation), [operation])
  const isReady = readinessInfo.hasBookingDate && readinessInfo.isBalanced && readinessInfo.hasEntries
  const canActuallyDecree = canDecree && isReady
  const canActuallyPost = canPost && isReady

  // Build validation message
  const getValidationMessage = () => {
    const issues: string[] = []
    if (!readinessInfo.hasBookingDate) {
      issues.push('Brak daty księgowania')
    }
    if (!readinessInfo.hasEntries) {
      issues.push('Brak dekretów')
    } else if (!readinessInfo.isBalanced) {
      issues.push(`Niezbilansowany: Wn ${readinessInfo.totalDebit.toFixed(2)}, Ma ${readinessInfo.totalCredit.toFixed(2)}`)
    }
    return issues
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otwórz menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(operation)
            setOpen('view')
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Podgląd
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(operation)
              setOpen('edit')
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {canDecree && canActuallyDecree && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(operation)
              setOpen('decree')
            }}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            Zadekretuj
          </DropdownMenuItem>
        )}
        {canDecree && !canActuallyDecree && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                  <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                  Zadekretuj
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium">Nie można zadekretować</p>
                {getValidationMessage().map((msg, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{msg}</p>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {canPost && canActuallyPost && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(operation)
              setOpen('post')
            }}
          >
            <BookCheck className="mr-2 h-4 w-4" />
            Zaksięguj
          </DropdownMenuItem>
        )}
        {canPost && !canActuallyPost && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                  <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                  Zaksięguj
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium">Nie można zaksięgować</p>
                {getValidationMessage().map((msg, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{msg}</p>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {canUnpost && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(operation)
              setOpen('unpost')
            }}
          >
            <BookX className="mr-2 h-4 w-4" />
            Odksięguj
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setCurrentRow(operation)
                setOpen('delete')
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

