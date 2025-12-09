import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { trialBalanceApi } from '@/services/trial-balance'
import { journalService } from '@/services/journals'
import { fiscalPeriodService, type FiscalPeriod } from '@/services/fiscal-periods'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Printer, Loader2 } from 'lucide-react'
import { TrialBalanceTable } from './components/trial-balance-table'

type OperationStatus = 'all' | 'ZADEKRETOWANE' | 'ZAKSIEGOWANE'

// Pomocnicza funkcja do formatowania daty na YYYY-MM-DD
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function TrialBalance() {
  const { currentUnit } = useAuthStore()
  const unitId = currentUnit?.id || ''

  const [fiscalPeriodId, setFiscalPeriodId] = useState<string>('')
  const [journalId, setJournalId] = useState<string>('all')
  const [status, setStatus] = useState<OperationStatus>('ZAKSIEGOWANE')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [shouldFetch, setShouldFetch] = useState(false)

  // Pobierz okresy obrachunkowe
  const { data: fiscalPeriods = [] } = useQuery({
    queryKey: ['fiscal-periods', unitId],
    queryFn: () => fiscalPeriodService.getAll(unitId),
    enabled: !!unitId,
  })

  const { data: journals = [] } = useQuery({
    queryKey: ['journals', unitId],
    queryFn: () => journalService.getAll(unitId),
    enabled: !!unitId,
  })

  // Ustaw domyślny aktywny okres i daty po załadowaniu okresów
  useEffect(() => {
    if (fiscalPeriods.length > 0 && !fiscalPeriodId) {
      const activePeriod = fiscalPeriods.find(p => p.isActive) || fiscalPeriods[0]
      setFiscalPeriodId(activePeriod.id)
      setDateFrom(formatDate(activePeriod.startDate))
      setDateTo(formatDate(activePeriod.endDate))
    }
  }, [fiscalPeriods, fiscalPeriodId])

  // Aktualizuj daty gdy zmieni się okres
  const handlePeriodChange = (periodId: string) => {
    setFiscalPeriodId(periodId)
    setShouldFetch(false)
    const period = fiscalPeriods.find(p => p.id === periodId)
    if (period) {
      setDateFrom(formatDate(period.startDate))
      setDateTo(formatDate(period.endDate))
    }
  }

  const selectedPeriod = fiscalPeriods.find(p => p.id === fiscalPeriodId)

  const { data: trialBalanceData = [], isLoading, isFetching } = useQuery({
    queryKey: ['trial-balance', unitId, fiscalPeriodId, journalId, status, dateFrom, dateTo, shouldFetch],
    queryFn: () => trialBalanceApi.getTrialBalance({
      unitId,
      fiscalPeriodId: fiscalPeriodId || undefined,
      journalId: journalId !== 'all' ? journalId : undefined,
      status: status !== 'all' ? status : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    enabled: !!unitId && !!fiscalPeriodId && shouldFetch,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Okres obrachunkowy</Label>
                <Select value={fiscalPeriodId} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz okres" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalPeriods.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.isActive && '(aktywny)'} {p.isClosed && '(zamknięty)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

