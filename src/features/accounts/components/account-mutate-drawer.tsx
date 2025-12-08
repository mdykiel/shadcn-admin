import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { accountsService } from '@/services/accounts'
import { journalService } from '@/services/journals'
import { fiscalPeriodService, FiscalPeriod } from '@/services/fiscal-periods'
import { useAuthStore } from '@/store/auth'
import { Account, AccountType, BalanceSide, Journal } from '@/types/auth'

const formSchema = z.object({
  journalId: z.string().min(1, 'Dziennik jest wymagany'),
  fiscalPeriodId: z.string().min(1, 'Okres obrachunkowy jest wymagany'),
  number: z.string().min(1, 'Numer konta jest wymagany').max(20, 'Numer może mieć maksymalnie 20 znaków'),
  name: z.string().min(1, 'Nazwa jest wymagana').max(200, 'Nazwa może mieć maksymalnie 200 znaków'),
  zespol: z.number().min(0).max(8),
  syntetyczne: z.string().min(1, 'Konto syntetyczne jest wymagane').max(10),
  analitpierwsze: z.string().max(10).optional().or(z.literal('')),
  analitdrugie: z.string().max(10).optional().or(z.literal('')),
  accountType: z.enum(['BILANSOWE_AKTYWNE', 'BILANSOWE_PASYWNE', 'BILANSOWE_AKTYWNO_PASYWNE', 'WYNIKOWE_KOSZTOWE', 'WYNIKOWE_PRZYCHODOWE', 'POZABILANSOWE', 'ROZLICZENIOWE']),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().max(500).optional().or(z.literal('')),
})

type AccountForm = z.infer<typeof formSchema>

type AccountMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Account
  defaultJournalId?: string
  defaultFiscalPeriodId?: string
  mode?: 'add' | 'edit' | 'addAnalytical'
  parentAccount?: Account // For adding analytical account
}

const accountTypeOptions: { value: AccountType; label: string }[] = [
  { value: 'BILANSOWE_AKTYWNE', label: 'Bilansowe - Aktywa' },
  { value: 'BILANSOWE_PASYWNE', label: 'Bilansowe - Pasywa' },
  { value: 'BILANSOWE_AKTYWNO_PASYWNE', label: 'Bilansowe - Aktywno-pasywne' },
  { value: 'WYNIKOWE_KOSZTOWE', label: 'Wynikowe - Kosztowe' },
  { value: 'WYNIKOWE_PRZYCHODOWE', label: 'Wynikowe - Przychodowe' },
  { value: 'POZABILANSOWE', label: 'Pozabilansowe' },
  { value: 'ROZLICZENIOWE', label: 'Rozliczeniowe' },
]

const balanceOptions: { value: BalanceSide; label: string }[] = [
  { value: 'DEBIT', label: 'Winien (Wn)' },
  { value: 'CREDIT', label: 'Ma (Ma)' },
]

const zespolOptions = Array.from({ length: 9 }, (_, i) => ({
  value: i,
  label: `Zespół ${i}`,
}))

export function AccountMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  defaultJournalId,
  defaultFiscalPeriodId,
  mode = 'add',
  parentAccount,
}: AccountMutateDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [journals, setJournals] = useState<Journal[]>([])
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([])
  const [existingAccounts, setExistingAccounts] = useState<Account[]>([])
  const [nextAnalyticalData, setNextAnalyticalData] = useState<{ number: string; analitpierwsze: string; analitdrugie: string } | null>(null)
  const { currentUnit } = useAuthStore()
  const isUpdate = mode === 'edit'
  const isAddAnalytical = mode === 'addAnalytical'

  // Helper function to calculate next analytical number based on existing accounts
  const calculateNextAnalyticalNumber = (parent: Account, existingAccs: Account[]): { number: string; analitpierwsze: string; analitdrugie: string } => {
    // Find all child accounts of this parent (accounts that start with parent number)
    const childAccounts = existingAccs.filter(acc =>
      acc.syntetyczne === parent.syntetyczne &&
      acc.id !== parent.id &&
      acc.number.startsWith(parent.number)
    )

    // If parent has no analytical levels, add first level
    if (!parent.analitpierwsze) {
      // Find existing first-level analytics
      const existingFirstLevel = childAccounts
        .filter(acc => acc.analitpierwsze && !acc.analitdrugie)
        .map(acc => parseInt(acc.analitpierwsze || '0', 10))
        .filter(n => !isNaN(n))

      const nextNum = existingFirstLevel.length > 0
        ? Math.max(...existingFirstLevel) + 1
        : 1
      const nextStr = nextNum.toString().padStart(2, '0')

      return {
        number: `${parent.number}-${nextStr}`,
        analitpierwsze: nextStr,
        analitdrugie: '',
      }
    }

    // If parent has first level but no second, add second level
    if (!parent.analitdrugie) {
      // Find existing second-level analytics under this first level
      const existingSecondLevel = childAccounts
        .filter(acc => acc.analitpierwsze === parent.analitpierwsze && acc.analitdrugie)
        .map(acc => parseInt(acc.analitdrugie || '0', 10))
        .filter(n => !isNaN(n))

      const nextNum = existingSecondLevel.length > 0
        ? Math.max(...existingSecondLevel) + 1
        : 1
      const nextStr = nextNum.toString().padStart(2, '0')

      return {
        number: `${parent.number}-${nextStr}`,
        analitpierwsze: parent.analitpierwsze,
        analitdrugie: nextStr,
      }
    }

    // Parent already has two levels - suggest next at same level
    return {
      number: `${parent.number}-01`,
      analitpierwsze: parent.analitpierwsze,
      analitdrugie: '',
    }
  }

  // Load journals, fiscal periods, and existing accounts for analytical calculation
  useEffect(() => {
    const loadData = async () => {
      if (!currentUnit) return
      try {
        // Get all active journals
        const journalsList = await journalService.getActive(currentUnit.id)
        setJournals(journalsList)

        // Get fiscal periods
        const periods = await fiscalPeriodService.getAll(currentUnit.id)
        setFiscalPeriods(periods)

        // If adding analytical account, load existing accounts to calculate next number
        if (isAddAnalytical && parentAccount) {
          const accounts = await accountsService.getAll(
            currentUnit.id,
            parentAccount.journalId,
            parentAccount.fiscalPeriodId
          )
          setExistingAccounts(accounts)

          // Calculate next analytical number
          const nextData = calculateNextAnalyticalNumber(parentAccount, accounts)
          setNextAnalyticalData(nextData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    if (open) {
      loadData()
    }
  }, [currentUnit, open, isAddAnalytical, parentAccount])

  const form = useForm<AccountForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow ? {
      journalId: currentRow.journalId,
      fiscalPeriodId: currentRow.fiscalPeriodId || '',
      number: currentRow.number,
      name: currentRow.name,
      zespol: currentRow.zespol,
      syntetyczne: currentRow.syntetyczne,
      analitpierwsze: currentRow.analitpierwsze || '',
      analitdrugie: currentRow.analitdrugie || '',
      accountType: currentRow.accountType,
      normalBalance: currentRow.normalBalance,
      description: currentRow.description || '',
    } : {
      journalId: defaultJournalId || '',
      fiscalPeriodId: defaultFiscalPeriodId || '',
      number: '',
      name: '',
      zespol: 0,
      syntetyczne: '',
      analitpierwsze: '',
      analitdrugie: '',
      accountType: 'BILANSOWE_AKTYWNE',
      normalBalance: 'DEBIT',
      description: '',
    },
  })

  // Reset form when currentRow or open changes, or when nextAnalyticalData is calculated
  useEffect(() => {
    if (open) {
      if (isAddAnalytical && parentAccount && nextAnalyticalData) {
        // Mode: Add analytical account based on parent - use calculated next number
        form.reset({
          journalId: parentAccount.journalId,
          fiscalPeriodId: parentAccount.fiscalPeriodId || defaultFiscalPeriodId || '',
          number: nextAnalyticalData.number,
          name: '', // User fills this
          zespol: parentAccount.zespol,
          syntetyczne: parentAccount.syntetyczne,
          analitpierwsze: nextAnalyticalData.analitpierwsze,
          analitdrugie: nextAnalyticalData.analitdrugie,
          accountType: parentAccount.accountType,
          normalBalance: parentAccount.normalBalance,
          description: '',
        })
      } else if (isUpdate && currentRow) {
        // Mode: Edit existing account
        form.reset({
          journalId: currentRow.journalId,
          fiscalPeriodId: currentRow.fiscalPeriodId || defaultFiscalPeriodId || '',
          number: currentRow.number,
          name: currentRow.name,
          zespol: currentRow.zespol,
          syntetyczne: currentRow.syntetyczne,
          analitpierwsze: currentRow.analitpierwsze || '',
          analitdrugie: currentRow.analitdrugie || '',
          accountType: currentRow.accountType,
          normalBalance: currentRow.normalBalance,
          description: currentRow.description || '',
        })
      } else if (!isAddAnalytical) {
        // Mode: Add new account from scratch (only if not waiting for analytical data)
        form.reset({
          journalId: defaultJournalId || '',
          fiscalPeriodId: defaultFiscalPeriodId || '',
          number: '',
          name: '',
          zespol: 0,
          syntetyczne: '',
          analitpierwsze: '',
          analitdrugie: '',
          accountType: 'BILANSOWE_AKTYWNE',
          normalBalance: 'DEBIT',
          description: '',
        })
      }
    }
  }, [currentRow, open, defaultJournalId, defaultFiscalPeriodId, form, isAddAnalytical, isUpdate, parentAccount, nextAnalyticalData])

  // Clear nextAnalyticalData when drawer closes
  useEffect(() => {
    if (!open) {
      setNextAnalyticalData(null)
      setExistingAccounts([])
    }
  }, [open])

  const onSubmit = async (data: AccountForm) => {
    if (!currentUnit) {
      toast.error('Brak wybranej jednostki budżetowej')
      return
    }

    setIsLoading(true)

    try {
      // Convert empty strings to undefined
      const cleanData = {
        ...data,
        analitpierwsze: data.analitpierwsze || undefined,
        analitdrugie: data.analitdrugie || undefined,
        description: data.description || undefined,
      }

      if (isUpdate && currentRow) {
        await accountsService.update(currentUnit.id, currentRow.id, cleanData)
        toast.success('Konto zostało zaktualizowane pomyślnie')
      } else {
        await accountsService.create(currentUnit.id, cleanData)
        toast.success('Konto zostało utworzone pomyślnie')
      }

      onOpenChange(false)
      form.reset()
      // In a real app, you'd refresh the data here
      window.location.reload()
    } catch (error: any) {
      console.error('Account mutation error:', error)
      // Better error messages for common errors
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas zapisywania konta'

      if (errorMessage.includes('unique') || errorMessage.includes('Unique') || errorMessage.includes('already exists')) {
        toast.error(`Konto o numerze "${data.number}" już istnieje w tym dzienniku i okresie obrachunkowym. Wybierz inny numer.`)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          form.reset()
        }
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>
            {isUpdate ? 'Edytuj' : isAddAnalytical ? 'Dodaj analitykę do' : 'Utwórz'} konto księgowe
            {isAddAnalytical && parentAccount && (
              <span className="font-mono text-primary ml-2">{parentAccount.number}</span>
            )}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Zaktualizuj dane konta księgowego.'
              : isAddAnalytical && parentAccount
                ? `Dodaj konto analityczne do konta "${parentAccount.name}". Pola zostały wstępnie wypełnione.`
                : 'Dodaj nowe konto księgowe do planu kont.'}
            {' '}Kliknij zapisz, gdy skończysz.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='account-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-2'
          >
            {/* Journal and Fiscal Period selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="journalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dziennik *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz dziennik" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {journals.map((journal) => (
                          <SelectItem key={journal.id} value={journal.id}>
                            {journal.shortName} - {journal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fiscalPeriodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okres obrachunkowy *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz okres" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fiscalPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name} {period.isActive && '(aktywny)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numer konta *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 011, 130-01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unikalny numer konta księgowego
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zespol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zespół *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz zespół" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zespolOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa konta *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Środki trwałe, Materiały biurowe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="syntetyczne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konto syntetyczne *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 011, 130" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="analitpierwsze"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analityczne I</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="analitdrugie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analityczne II</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ konta *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz typ konta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="normalBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo normalne *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz stronę salda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {balanceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opcjonalny opis konta księgowego"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Anuluj</Button>
          </SheetClose>
          <Button
            form='account-form'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}