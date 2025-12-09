import { ArrowRight, Calendar, FileText, Building2, Hash, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Operation, OperationStatus, DocumentType, JournalEntry } from '@/types/auth'
import { useOperations } from './operations-provider'

const statusLabels: Record<OperationStatus, string> = {
  WPROWADZONE: 'Wprowadzone',
  ZADEKRETOWANE: 'Zadekretowane',
  ZAKSIEGOWANE: 'Zaksięgowane',
  ANULOWANE: 'Anulowane',
}

const statusColors: Record<OperationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  WPROWADZONE: 'secondary',
  ZADEKRETOWANE: 'outline',
  ZAKSIEGOWANE: 'default',
  ANULOWANE: 'destructive',
}

const documentTypeLabels: Record<DocumentType, string> = {
  BO: 'Bilans otwarcia',
  FAKTURA_ZAKUP: 'Faktura zakupu',
  FAKTURA_SPRZEDAZ: 'Faktura sprzedaży',
  WYCIAG_BANKOWY: 'Wyciąg bankowy',
  RAPORT_KASOWY: 'Raport kasowy',
  LISTA_PLAC: 'Lista płac',
  PK: 'Polecenie księgowania',
  NOTA_KSIEGOWA: 'Nota księgowa',
  OT: 'Przyjęcie środka trwałego',
  LT: 'Likwidacja środka trwałego',
  INNE: 'Inny dokument',
}

interface OperationViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: Operation | null
}

const formatAmount = (amount: string | number) => {
  return parseFloat(String(amount)).toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  })
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Component for a single journal entry row with nice formatting
function EntryRow({ entry, index }: { entry: JournalEntry; index: number }) {
  const hasDebit = entry.debitAccount
  const hasCredit = entry.creditAccount
  const hasOffBalanceDebit = entry.offBalanceDebitAccount
  const hasOffBalanceCredit = entry.offBalanceCreditAccount
  const hasClassification = entry.classification

  return (
    <TableRow className="group/row">
      <TableCell className="text-center font-medium text-muted-foreground w-10">
        {index + 1}
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{entry.description || 'Brak opisu'}</span>
          {hasClassification && (
            <span className="text-xs text-muted-foreground font-mono">
              Klasyfikacja: {entry.classification!.dzial}.{entry.classification!.rozdzial}.{entry.classification!.paragraf}
              {entry.classification!.podparagraf && `.${entry.classification!.podparagraf}`}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold whitespace-nowrap">
        {formatAmount(entry.amount)}
      </TableCell>
      <TableCell className="min-w-[280px]">
        <div className="flex items-center gap-2">
          {/* Debit account (Wn) */}
          <div className="flex-1">
            {hasDebit ? (
              <div className="flex flex-col gap-0.5 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Wn</span>
                <span className="font-mono font-semibold text-sm">{entry.debitAccount!.number}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{entry.debitAccount!.name}</span>
              </div>
            ) : (
              <div className="p-2 rounded-md bg-muted/50 text-center text-xs text-muted-foreground">—</div>
            )}
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          {/* Credit account (Ma) */}
          <div className="flex-1">
            {hasCredit ? (
              <div className="flex flex-col gap-0.5 p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Ma</span>
                <span className="font-mono font-semibold text-sm">{entry.creditAccount!.number}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{entry.creditAccount!.name}</span>
              </div>
            ) : (
              <div className="p-2 rounded-md bg-muted/50 text-center text-xs text-muted-foreground">—</div>
            )}
          </div>
        </div>

        {/* Off-balance accounts if present */}
        {(hasOffBalanceDebit || hasOffBalanceCredit) && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
            <div className="flex-1">
              {hasOffBalanceDebit ? (
                <div className="flex flex-col gap-0.5 p-1.5 rounded-md bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/50">
                  <span className="text-[9px] font-medium text-orange-600 dark:text-orange-400 uppercase">Poz. Wn</span>
                  <span className="font-mono text-xs">{entry.offBalanceDebitAccount!.number}</span>
                </div>
              ) : (
                <div className="p-1.5 text-center text-xs text-muted-foreground">—</div>
              )}
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1">
              {hasOffBalanceCredit ? (
                <div className="flex flex-col gap-0.5 p-1.5 rounded-md bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/50">
                  <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400 uppercase">Poz. Ma</span>
                  <span className="font-mono text-xs">{entry.offBalanceCreditAccount!.number}</span>
                </div>
              ) : (
                <div className="p-1.5 text-center text-xs text-muted-foreground">—</div>
              )}
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

export function OperationViewDialog({ open, onOpenChange, operation }: OperationViewDialogProps) {
  const { setOpen, setCurrentRow } = useOperations()

  if (!operation) return null

  const entries = operation.entries || []
  const totalDebit = entries.reduce((sum, e) => sum + (e.debitAccount ? parseFloat(String(e.amount)) : 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (e.creditAccount ? parseFloat(String(e.amount)) : 0), 0)

  const canEdit = operation.status === 'WPROWADZONE' || operation.status === 'ZADEKRETOWANE'

  const handleEdit = () => {
    setCurrentRow(operation)
    onOpenChange(false)
    setTimeout(() => setOpen('edit'), 100)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-4xl w-full p-0">
        <SheetHeader className="text-left px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {operation.documentNumber}
              <Badge variant={statusColors[operation.status]}>
                {statusLabels[operation.status]}
              </Badge>
            </SheetTitle>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
            )}
          </div>
          <SheetDescription className="flex items-center gap-2">
            {documentTypeLabels[operation.documentType]}
            {operation.journal && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {operation.journal.shortName}
                </Badge>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Date info */}
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Data wprowadzenia</span>
              </div>
              <p className="font-semibold">{formatDate(operation.entryDate)}</p>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Data księgowania</span>
              </div>
              <p className="font-semibold">{formatDate(operation.bookingDate)}</p>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Termin płatności</span>
              </div>
              <p className="font-semibold">{formatDate(operation.dueDate)}</p>
            </div>

            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Hash className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Kwota operacji</span>
              </div>
              <p className="font-bold text-lg text-primary">{formatAmount(operation.totalAmount)}</p>
            </div>
          </div>

          {/* Contractor info */}
          {(operation.contractorName || operation.contractorNip) && (
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Kontrahent</span>
              </div>
              <p className="font-semibold">{operation.contractorName || '—'}</p>
              {operation.contractorNip && (
                <p className="text-sm text-muted-foreground">NIP: {operation.contractorNip}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-sm font-medium text-muted-foreground mb-1">Opis operacji</p>
            <p className="font-medium">{operation.description || '—'}</p>
          </div>

          <Separator />

          {/* Journal entries section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dekrety księgowe</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500"></span>
                  Wn: {formatAmount(totalDebit)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500"></span>
                  Ma: {formatAmount(totalCredit)}
                </span>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Brak dekretów księgowych</p>
                <p className="text-sm">Operacja wymaga dekretacji</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10 text-center">Lp.</TableHead>
                      <TableHead>Opis / Klasyfikacja</TableHead>
                      <TableHead className="text-right w-28">Kwota</TableHead>
                      <TableHead className="min-w-[280px]">Konta (Wn → Ma)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <EntryRow key={entry.id} entry={entry} index={index} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

