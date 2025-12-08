import { Operation, JournalEntry } from '@/types/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface OperationEntriesTableProps {
  operation: Operation
}

export function OperationEntriesTable({ operation }: OperationEntriesTableProps) {
  const entries = operation.entries || []

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Brak wpisów księgowych. Operacja wymaga dekretacji.
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">Lp.</TableHead>
            <TableHead className="min-w-[100px]">Opis</TableHead>
            <TableHead className="text-right w-28">Kwota</TableHead>
            <TableHead className="w-24">WN</TableHead>
            <TableHead className="w-24">MA</TableHead>
            <TableHead className="w-24">Poz. WN</TableHead>
            <TableHead className="w-24">Poz. MA</TableHead>
            <TableHead className="w-36">Klasyfikacja</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium text-center">{index + 1}</TableCell>
              <TableCell className="text-sm">
                {entry.description || '-'}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {parseFloat(String(entry.amount)).toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </TableCell>
              <TableCell>
                {entry.debitAccount ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {entry.debitAccount.number}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {entry.creditAccount ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {entry.creditAccount.number}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {entry.offBalanceDebitAccount ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.offBalanceDebitAccount.number}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {entry.offBalanceCreditAccount ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.offBalanceCreditAccount.number}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {entry.classification ? (
                  <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
                    {entry.classification.dzial}.{entry.classification.rozdzial}.
                    {entry.classification.paragraf}
                    {entry.classification.podparagraf && `.${entry.classification.podparagraf}`}
                  </Badge>
                ) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

