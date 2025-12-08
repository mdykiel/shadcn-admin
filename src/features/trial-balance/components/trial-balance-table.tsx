import { TrialBalanceRow } from '@/services/trial-balance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TrialBalanceTotals {
  boDebit: number
  boCredit: number
  turnoverDebit: number
  turnoverCredit: number
  cumulativeDebit: number
  cumulativeCredit: number
  endingBalanceDebit: number
  endingBalanceCredit: number
}

interface TrialBalanceTableProps {
  data: TrialBalanceRow[]
  totals: TrialBalanceTotals
  isLoading: boolean
}

const formatCurrency = (value: number) => {
  if (value === 0) return '-'
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function TrialBalanceTable({ data, totals, isLoading }: TrialBalanceTableProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // Filtruj tylko konta z jakimikolwiek obrotami
  const activeData = data.filter(row => 
    row.boDebit !== 0 || row.boCredit !== 0 ||
    row.turnoverDebit !== 0 || row.turnoverCredit !== 0 ||
    row.cumulativeDebit !== 0 || row.cumulativeCredit !== 0 ||
    row.endingBalanceDebit !== 0 || row.endingBalanceCredit !== 0
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead rowSpan={2} className="border-r font-semibold w-24">Konto</TableHead>
            <TableHead rowSpan={2} className="border-r font-semibold min-w-[200px]">Nazwa konta</TableHead>
            <TableHead colSpan={2} className="border-r text-center font-semibold bg-blue-50 dark:bg-blue-950">
              Bilans otwarcia
            </TableHead>
            <TableHead colSpan={2} className="border-r text-center font-semibold bg-yellow-50 dark:bg-yellow-950">
              Obroty okresu
            </TableHead>
            <TableHead colSpan={2} className="border-r text-center font-semibold bg-orange-50 dark:bg-orange-950">
              Obroty narastająco
            </TableHead>
            <TableHead colSpan={2} className="text-center font-semibold bg-green-50 dark:bg-green-950">
              Saldo końcowe
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/30">
            <TableHead className="text-center text-xs font-medium bg-blue-50 dark:bg-blue-950 w-28">Wn</TableHead>
            <TableHead className="text-center text-xs font-medium border-r bg-blue-50 dark:bg-blue-950 w-28">Ma</TableHead>
            <TableHead className="text-center text-xs font-medium bg-yellow-50 dark:bg-yellow-950 w-28">Wn</TableHead>
            <TableHead className="text-center text-xs font-medium border-r bg-yellow-50 dark:bg-yellow-950 w-28">Ma</TableHead>
            <TableHead className="text-center text-xs font-medium bg-orange-50 dark:bg-orange-950 w-28">Wn</TableHead>
            <TableHead className="text-center text-xs font-medium border-r bg-orange-50 dark:bg-orange-950 w-28">Ma</TableHead>
            <TableHead className="text-center text-xs font-medium bg-green-50 dark:bg-green-950 w-28">Wn</TableHead>
            <TableHead className="text-center text-xs font-medium bg-green-50 dark:bg-green-950 w-28">Ma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Brak danych do wyświetlenia. Sprawdź czy istnieją zaksięgowane operacje.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {activeData.map((row) => (
                <TableRow key={row.accountId} className="hover:bg-muted/50">
                  <TableCell className="border-r font-mono text-sm">{row.accountNumber}</TableCell>
                  <TableCell className="border-r text-sm">{row.accountName}</TableCell>
                  <TableCell className="text-right font-mono text-sm bg-blue-50/30 dark:bg-blue-950/30">
                    {formatCurrency(row.boDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm border-r bg-blue-50/30 dark:bg-blue-950/30">
                    {formatCurrency(row.boCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-yellow-50/30 dark:bg-yellow-950/30">
                    {formatCurrency(row.turnoverDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm border-r bg-yellow-50/30 dark:bg-yellow-950/30">
                    {formatCurrency(row.turnoverCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-orange-50/30 dark:bg-orange-950/30">
                    {formatCurrency(row.cumulativeDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm border-r bg-orange-50/30 dark:bg-orange-950/30">
                    {formatCurrency(row.cumulativeCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-green-50/30 dark:bg-green-950/30">
                    {formatCurrency(row.endingBalanceDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm bg-green-50/30 dark:bg-green-950/30">
                    {formatCurrency(row.endingBalanceCredit)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Wiersz sum */}
              <TableRow className="bg-muted font-semibold border-t-2">
                <TableCell className="border-r">SUMA</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right font-mono bg-blue-100 dark:bg-blue-900">
                  {formatCurrency(totals.boDebit)}
                </TableCell>
                <TableCell className="text-right font-mono border-r bg-blue-100 dark:bg-blue-900">
                  {formatCurrency(totals.boCredit)}
                </TableCell>
                <TableCell className="text-right font-mono bg-yellow-100 dark:bg-yellow-900">
                  {formatCurrency(totals.turnoverDebit)}
                </TableCell>
                <TableCell className="text-right font-mono border-r bg-yellow-100 dark:bg-yellow-900">
                  {formatCurrency(totals.turnoverCredit)}
                </TableCell>
                <TableCell className="text-right font-mono bg-orange-100 dark:bg-orange-900">
                  {formatCurrency(totals.cumulativeDebit)}
                </TableCell>
                <TableCell className="text-right font-mono border-r bg-orange-100 dark:bg-orange-900">
                  {formatCurrency(totals.cumulativeCredit)}
                </TableCell>
                <TableCell className="text-right font-mono bg-green-100 dark:bg-green-900">
                  {formatCurrency(totals.endingBalanceDebit)}
                </TableCell>
                <TableCell className="text-right font-mono bg-green-100 dark:bg-green-900">
                  {formatCurrency(totals.endingBalanceCredit)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

