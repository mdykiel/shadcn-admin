import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { trialBalanceApi, TrialBalanceRow } from '@/services/trial-balance'
import { journalService } from '@/services/journals'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Printer, Loader2 } from 'lucide-react'
import { TrialBalanceTable } from './components/trial-balance-table'

type OperationStatus = 'all' | 'ZADEKRETOWANE' | 'ZAKSIEGOWANE'

export function TrialBalance() {
  const { user } = useAuthStore()
  const unitId = user?.unitId || ''

  const [journalId, setJournalId] = useState<string>('all')
  const [status, setStatus] = useState<OperationStatus>('ZAKSIEGOWANE')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0])
  const [yearStart, setYearStart] = useState<string>(`${new Date().getFullYear()}-01-01`)
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data: journals = [] } = useQuery({
    queryKey: ['journals', unitId],
    queryFn: () => journalService.getAll(unitId),
    enabled: !!unitId,
  })

  const { data: trialBalanceData = [], isLoading, isFetching } = useQuery({
    queryKey: ['trial-balance', unitId, journalId, status, dateFrom, dateTo, yearStart, shouldFetch],
    queryFn: () => trialBalanceApi.getTrialBalance({
      unitId,
      journalId: journalId !== 'all' ? journalId : undefined,
      status: status !== 'all' ? status : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      yearStart: yearStart || undefined,
    }),
    enabled: !!unitId && shouldFetch,
  })

  const handleGenerate = () => {
    setShouldFetch(true)
  }

  // Oblicz sumy
  const totals = useMemo(() => trialBalanceData.reduce((acc, row) => ({
    boDebit: acc.boDebit + row.boDebit,
    boCredit: acc.boCredit + row.boCredit,
    turnoverDebit: acc.turnoverDebit + row.turnoverDebit,
    turnoverCredit: acc.turnoverCredit + row.turnoverCredit,
    cumulativeDebit: acc.cumulativeDebit + row.cumulativeDebit,
    cumulativeCredit: acc.cumulativeCredit + row.cumulativeCredit,
    endingBalanceDebit: acc.endingBalanceDebit + row.endingBalanceDebit,
    endingBalanceCredit: acc.endingBalanceCredit + row.endingBalanceCredit,
  }), {
    boDebit: 0, boCredit: 0,
    turnoverDebit: 0, turnoverCredit: 0,
    cumulativeDebit: 0, cumulativeCredit: 0,
    endingBalanceDebit: 0, endingBalanceCredit: 0,
  }), [trialBalanceData])

  return (
    <>
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Zestawienie obrotów i sald</h1>
          <p className="text-muted-foreground">
            Zestawienie prezentuje bilans otwarcia, obroty oraz salda końcowe kont księgowych.
          </p>
        </div>

        {/* Filtry */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Parametry zestawienia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Dziennik</Label>
                <Select value={journalId} onValueChange={(v) => { setJournalId(v); setShouldFetch(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    {journals.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.shortName} - {j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: OperationStatus) => { setStatus(v); setShouldFetch(false); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="ZADEKRETOWANE">Zadekretowane</SelectItem>
                    <SelectItem value="ZAKSIEGOWANE">Zaksięgowane</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Początek roku</Label>
                <Input type="date" value={yearStart} onChange={e => { setYearStart(e.target.value); setShouldFetch(false); }} />
              </div>
              <div className="space-y-2">
                <Label>Data od</Label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setShouldFetch(false); }} />
              </div>
              <div className="space-y-2">
                <Label>Data do</Label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setShouldFetch(false); }} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleGenerate} disabled={isFetching} className="flex-1">
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generuj
                </Button>
                <Button variant="outline" size="icon" title="Eksportuj do Excel">
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Drukuj">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <TrialBalanceTable 
              data={trialBalanceData} 
              totals={totals}
              isLoading={isLoading} 
            />
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

