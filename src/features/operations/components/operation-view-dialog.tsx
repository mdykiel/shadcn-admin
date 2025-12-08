import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Operation, OperationStatus, DocumentType } from '@/types/auth'
import { OperationEntriesTable } from './operation-entries-table'

const statusLabels: Record<OperationStatus, string> = {
  WPROWADZONE: 'Wprowadzone',
  ZADEKRETOWANE: 'Zadekretowane',
  ZAKSIEGOWANE: 'Zaksięgowane',
  ANULOWANE: 'Anulowane',
}

const statusColors: Record<OperationStatus, string> = {
  WPROWADZONE: 'bg-yellow-100 text-yellow-800',
  ZADEKRETOWANE: 'bg-blue-100 text-blue-800',
  ZAKSIEGOWANE: 'bg-green-100 text-green-800',
  ANULOWANE: 'bg-gray-100 text-gray-800',
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

export function OperationViewDialog({ open, onOpenChange, operation }: OperationViewDialogProps) {
  if (!operation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Szczegóły operacji: {operation.documentNumber}
            <Badge className={statusColors[operation.status]} variant="outline">
              {statusLabels[operation.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {documentTypeLabels[operation.documentType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Operation details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Data wprowadzenia</p>
              <p className="font-medium">
                {new Date(operation.entryDate).toLocaleDateString('pl-PL')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data księgowania</p>
              <p className="font-medium">
                {operation.bookingDate
                  ? new Date(operation.bookingDate).toLocaleDateString('pl-PL')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Termin płatności</p>
              <p className="font-medium">
                {operation.dueDate
                  ? new Date(operation.dueDate).toLocaleDateString('pl-PL')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kwota</p>
              <p className="font-medium text-lg">
                {parseFloat(String(operation.totalAmount)).toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Kontrahent</p>
              <p className="font-medium">{operation.contractorName || '-'}</p>
              {operation.contractorNip && (
                <p className="text-sm text-muted-foreground">NIP: {operation.contractorNip}</p>
              )}
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-muted-foreground">Opis</p>
              <p className="font-medium">{operation.description}</p>
            </div>
          </div>

          {/* Journal entries */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Wpisy księgowe (dekrety)</h3>
            <OperationEntriesTable operation={operation} />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zamknij
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

