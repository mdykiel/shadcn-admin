import { useEffect, useState, useMemo } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Operation, DocumentType, Journal, Account, BudgetClassification } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { operationsService } from '@/services/operations'
import { journalService } from '@/services/journals'
import { accountsService } from '@/services/accounts'
import { budgetClassificationService } from '@/services/budget-classification'

const documentTypeLabels: Record<DocumentType, string> = {
  BO: 'Bilans otwarcia (BO)',
  FAKTURA_ZAKUP: 'Faktura zakupu (FZ)',
  FAKTURA_SPRZEDAZ: 'Faktura sprzedaży (FS)',
  WYCIAG_BANKOWY: 'Wyciąg bankowy (WB)',
  RAPORT_KASOWY: 'Raport kasowy (RK)',
  LISTA_PLAC: 'Lista płac (LP)',
  PK: 'Polecenie księgowania (PK)',
  NOTA_KSIEGOWA: 'Nota księgowa (NK)',
  OT: 'Przyjęcie środka trwałego (OT)',
  LT: 'Likwidacja środka trwałego (LT)',
  INNE: 'Inny dokument',
}

const entrySchema = z.object({
  debitAccountId: z.string().optional(),
  creditAccountId: z.string().optional(),
  offBalanceDebitAccountId: z.string().optional(),
  offBalanceCreditAccountId: z.string().optional(),
  classificationId: z.string().optional(),
  amount: z.string().min(1, 'Kwota jest wymagana'),
  description: z.string().optional(),
})

const formSchema = z.object({
  journalId: z.string().min(1, 'Dziennik jest wymagany'),
  documentType: z.enum(['BO', 'FAKTURA_ZAKUP', 'FAKTURA_SPRZEDAZ', 'WYCIAG_BANKOWY', 'RAPORT_KASOWY', 'LISTA_PLAC', 'PK', 'NOTA_KSIEGOWA', 'OT', 'LT', 'INNE']),
  documentNumber: z.string().min(1, 'Nr dokumentu jest wymagany'),
  description: z.string().min(1, 'Opis jest wymagany'),
  totalAmount: z.string().min(1, 'Kwota jest wymagana'),
  entryDate: z.string().optional(),
  bookingDate: z.string().min(1, 'Data księgowania jest wymagana'),
  dueDate: z.string().optional(),
  contractorName: z.string().optional(),
  contractorNip: z.string().optional(),
  entries: z.array(entrySchema).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface OperationMutateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Operation | null
  onSuccess?: () => void
}

export function OperationMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: OperationMutateDrawerProps) {
  const { currentUnit } = useAuthStore()
  const isUpdate = !!currentRow

  // Dane do list wyboru
  const [journals, setJournals] = useState<Journal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [offBalanceAccounts, setOffBalanceAccounts] = useState<Account[]>([])
  const [classifications, setClassifications] = useState<BudgetClassification[]>([])
  const [selectedJournalId, setSelectedJournalId] = useState<string>('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      journalId: '',
      documentType: 'PK',
      documentNumber: '',
      description: '',
      totalAmount: '',
      entryDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      contractorName: '',
      contractorNip: '',
      entries: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  })

  // Watch entries for balance validation
  const watchedEntries = useWatch({
    control: form.control,
    name: 'entries',
  })

  // Calculate balance validation
  const balanceInfo = useMemo(() => {
    if (!watchedEntries || watchedEntries.length === 0) {
      return { totalDebit: 0, totalCredit: 0, isBalanced: true, hasEntries: false }
    }

    let totalDebit = 0
    let totalCredit = 0

    watchedEntries.forEach(entry => {
      const amount = parseFloat(entry?.amount || '0') || 0
      if (entry?.debitAccountId) {
        totalDebit += amount
      }
      if (entry?.creditAccountId) {
        totalCredit += amount
      }
    })

    // Round to 2 decimal places to avoid floating point issues
    totalDebit = Math.round(totalDebit * 100) / 100
    totalCredit = Math.round(totalCredit * 100) / 100

    return {
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit && totalDebit > 0,
      hasEntries: watchedEntries.length > 0,
    }
  }, [watchedEntries])

  // Pobierz dzienniki przy otwarciu
  useEffect(() => {
    if (open && currentUnit) {
      journalService.getActive(currentUnit.id).then(setJournals).catch(console.error)
    }
  }, [open, currentUnit])

  // Pobierz konta i klasyfikacje przy zmianie dziennika
  useEffect(() => {
    if (selectedJournalId && currentUnit) {
      // Konta bilansowe - standardowe
      accountsService.getAll(currentUnit.id, selectedJournalId)
        .then(accs => {
          const balanceAccs = accs.filter(a => a.accountType !== 'POZABILANSOWE')
          const offBalanceAccs = accs.filter(a => a.accountType === 'POZABILANSOWE')
          setAccounts(balanceAccs)
          setOffBalanceAccounts(offBalanceAccs)
        })
        .catch(console.error)

      // Klasyfikacje budżetowe
      budgetClassificationService.getByJournal(currentUnit.id, selectedJournalId)
        .then(setClassifications)
        .catch(console.error)
    }
  }, [selectedJournalId, currentUnit])

  useEffect(() => {
    if (open) {
      if (currentRow) {
        setSelectedJournalId(currentRow.journalId)
        form.reset({
          journalId: currentRow.journalId,
          documentType: currentRow.documentType,
          documentNumber: currentRow.documentNumber,
          description: currentRow.description,
          totalAmount: String(currentRow.totalAmount),
          entryDate: currentRow.entryDate?.split('T')[0] || '',
          bookingDate: currentRow.bookingDate?.split('T')[0] || '',
          dueDate: currentRow.dueDate?.split('T')[0] || '',
          contractorName: currentRow.contractorName || '',
          contractorNip: currentRow.contractorNip || '',
          entries: currentRow.entries?.map(e => ({
            debitAccountId: e.debitAccountId || '',
            creditAccountId: e.creditAccountId || '',
            offBalanceDebitAccountId: e.offBalanceDebitAccountId || '',
            offBalanceCreditAccountId: e.offBalanceCreditAccountId || '',
            classificationId: e.classificationId || '',
            amount: String(e.amount),
            description: e.description || '',
          })) || [],
        })
      } else {
        setSelectedJournalId('')
        form.reset({
          journalId: '',
          documentType: 'PK',
          documentNumber: '',
          description: '',
          totalAmount: '',
          entryDate: new Date().toISOString().split('T')[0],
          bookingDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          contractorName: '',
          contractorNip: '',
          entries: [],
        })
      }
    }
  }, [open, currentRow, form])

  const onSubmit = async (values: FormValues) => {
    if (!currentUnit) {
      toast.error('Nie wybrano jednostki')
      return
    }

    try {
      const data = {
        journalId: values.journalId,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        description: values.description,
        totalAmount: parseFloat(values.totalAmount),
        entryDate: values.entryDate || undefined,
        bookingDate: values.bookingDate || undefined,
        dueDate: values.dueDate || undefined,
        contractorName: values.contractorName || undefined,
        contractorNip: values.contractorNip || undefined,
        entries: values.entries?.map(e => ({
          debitAccountId: e.debitAccountId || undefined,
          creditAccountId: e.creditAccountId || undefined,
          offBalanceDebitAccountId: e.offBalanceDebitAccountId || undefined,
          offBalanceCreditAccountId: e.offBalanceCreditAccountId || undefined,
          classificationId: e.classificationId || undefined,
          amount: parseFloat(e.amount),
          description: e.description || undefined,
        })).filter(e => e.amount > 0),
      }

      if (isUpdate && currentRow) {
        await operationsService.update(currentRow.id, data)
        toast.success('Operacja została zaktualizowana')
      } else {
        await operationsService.create(currentUnit.id, data)
        toast.success('Operacja została dodana')
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(isUpdate ? 'Nie udało się zaktualizować operacji' : 'Nie udało się dodać operacji')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Edytuj operację' : 'Dodaj operację'}</SheetTitle>
          <SheetDescription>
            {isUpdate ? 'Zaktualizuj dane operacji.' : 'Wprowadź dane nowej operacji księgowej.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form id="operation-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto p-4">
            <FormField
              control={form.control}
              name="journalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dziennik</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedJournalId(value)
                    }}
                  >
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
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ dokumentu</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nr dokumentu</FormLabel>
                  <FormControl>
                    <Input placeholder="np. FZ/001/2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data wprowadzenia</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data księgowania</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termin płatności</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kwota</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis operacji</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opisz operację..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kontrahent</FormLabel>
                    <FormControl>
                      <Input placeholder="Nazwa kontrahenta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractorNip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP kontrahenta</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-78-90" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sekcja dekretów */}
            {selectedJournalId && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Dekrety księgowe</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({
                        debitAccountId: '',
                        creditAccountId: '',
                        offBalanceDebitAccountId: '',
                        offBalanceCreditAccountId: '',
                        classificationId: '',
                        amount: '',
                        description: '',
                      })}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Dodaj dekret
                    </Button>
                  </div>

                  {/* Balance validation warning */}
                  {balanceInfo.hasEntries && !balanceInfo.isBalanced && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Dokument niezbilansowany</AlertTitle>
                      <AlertDescription>
                        <div className="mt-1 space-y-1 text-sm">
                          <div>Suma Wn: {balanceInfo.totalDebit.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div>
                          <div>Suma Ma: {balanceInfo.totalCredit.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div>
                          <div className="font-medium">
                            Różnica: {Math.abs(balanceInfo.totalDebit - balanceInfo.totalCredit).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Balance summary when balanced */}
                  {balanceInfo.hasEntries && balanceInfo.isBalanced && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <span className="font-medium">✓ Dokument zbilansowany</span>
                        <span>({balanceInfo.totalDebit.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })})</span>
                      </div>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm">Dekret #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.debitAccountId`}
                            render={({ field }) => {
                              const selectedAccount = accounts.find(a => a.id === field.value)
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">Konto WN</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs font-mono">
                                        <SelectValue placeholder="Wybierz">
                                          {selectedAccount?.number || 'Wybierz'}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                          {acc.number} - {acc.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )
                            }}
                          />
                          <FormField
                            control={form.control}
                            name={`entries.${index}.creditAccountId`}
                            render={({ field }) => {
                              const selectedAccount = accounts.find(a => a.id === field.value)
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">Konto MA</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs font-mono">
                                        <SelectValue placeholder="Wybierz">
                                          {selectedAccount?.number || 'Wybierz'}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                          {acc.number} - {acc.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )
                            }}
                          />
                        </div>

                        {offBalanceAccounts.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name={`entries.${index}.offBalanceDebitAccountId`}
                              render={({ field }) => {
                                const selectedAccount = offBalanceAccounts.find(a => a.id === field.value)
                                return (
                                  <FormItem>
                                    <FormLabel className="text-xs">Pozabilansowe WN</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-xs font-mono">
                                          <SelectValue placeholder="Opcjonalne">
                                            {selectedAccount?.number || 'Opcjonalne'}
                                          </SelectValue>
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {offBalanceAccounts.map(acc => (
                                          <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                            {acc.number} - {acc.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )
                              }}
                            />
                            <FormField
                              control={form.control}
                              name={`entries.${index}.offBalanceCreditAccountId`}
                              render={({ field }) => {
                                const selectedAccount = offBalanceAccounts.find(a => a.id === field.value)
                                return (
                                  <FormItem>
                                    <FormLabel className="text-xs">Pozabilansowe MA</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-xs font-mono">
                                          <SelectValue placeholder="Opcjonalne">
                                            {selectedAccount?.number || 'Opcjonalne'}
                                          </SelectValue>
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {offBalanceAccounts.map(acc => (
                                          <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                            {acc.number} - {acc.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )
                              }}
                            />
                          </div>
                        )}

                        {classifications.length > 0 && (
                          <FormField
                            control={form.control}
                            name={`entries.${index}.classificationId`}
                            render={({ field }) => {
                              const selectedCls = classifications.find(c => c.id === field.value)
                              const displayCode = selectedCls
                                ? `${selectedCls.dzial}.${selectedCls.rozdzial}.${selectedCls.paragraf}${selectedCls.podparagraf ? `.${selectedCls.podparagraf}` : ''}`
                                : null
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs">Klasyfikacja budżetowa</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-xs font-mono">
                                        <SelectValue placeholder="Wybierz klasyfikację">
                                          {displayCode || 'Wybierz klasyfikację'}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {classifications.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                          {cls.dzial}.{cls.rozdzial}.{cls.paragraf}{cls.podparagraf ? `.${cls.podparagraf}` : ''} - {cls.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )
                            }}
                          />
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Kwota</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" className="h-8 text-xs" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`entries.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Opis</FormLabel>
                                <FormControl>
                                  <Input className="h-8 text-xs" placeholder="Opcjonalny opis" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Anuluj</Button>
          </SheetClose>
          <Button form="operation-form" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Zapisywanie...' : isUpdate ? 'Zapisz zmiany' : 'Dodaj'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

