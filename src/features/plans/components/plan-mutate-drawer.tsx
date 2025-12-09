import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'
import { journalService } from '@/services/journals'
import type { BudgetClassification, Journal } from '@/types/auth'
import { type Plan, usePlans } from './plans-provider'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const planItemSchema = z.object({
  classificationId: z.string().min(1, 'Klasyfikacja jest wymagana'),
  plannedAmount: z.string().min(1, 'Kwota jest wymagana'),
})

const formSchema = z.object({
  year: z.number().min(2000).max(2100),
  planType: z.enum(['PROJEKT', 'PLAN_PIERWOTNY', 'PLAN_PO_ZMIANACH']),
  name: z.string().optional(),
  description: z.string().optional(),
  items: z.array(planItemSchema).optional(),
}).refine((data) => {
  if (!data.items || data.items.length === 0) return true
  const classificationIds = data.items.map(item => item.classificationId).filter(id => id)
  const uniqueIds = new Set(classificationIds)
  return classificationIds.length === uniqueIds.size
}, {
  message: 'Każda klasyfikacja może być użyta tylko raz w planie',
  path: ['items'],
})

type FormValues = z.infer<typeof formSchema>

interface PlanMutateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Plan | null
  onSuccess?: () => void
}

export function PlanMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: PlanMutateDrawerProps) {
  const { currentUnit, token } = useAuthStore()
  const { selectedYear } = usePlans()
  const isUpdate = !!currentRow

  const [journals, setJournals] = useState<Journal[]>([])
  const [selectedJournalId, setSelectedJournalId] = useState<string>('')
  const [classifications, setClassifications] = useState<BudgetClassification[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: selectedYear,
      planType: 'PROJEKT',
      name: '',
      description: '',
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Load journals on open
  useEffect(() => {
    if (open && currentUnit) {
      journalService.getActive(currentUnit.id).then((js) => {
        setJournals(js.filter(j => j.hasFinancialPlan))
        if (js.length > 0 && !selectedJournalId) {
          const defaultJournal = js.find(j => j.hasFinancialPlan)
          if (defaultJournal) setSelectedJournalId(defaultJournal.id)
        }
      }).catch(console.error)
    }
  }, [open, currentUnit, selectedJournalId])

  // Load classifications when journal selected
  useEffect(() => {
    if (selectedJournalId && currentUnit) {
      budgetClassificationService.getByJournal(currentUnit.id, selectedJournalId)
        .then(setClassifications)
        .catch(console.error)
    }
  }, [selectedJournalId, currentUnit])

  // Reset form on open
  useEffect(() => {
    if (open) {
      if (currentRow) {
        form.reset({
          year: currentRow.year,
          planType: currentRow.planType,
          name: currentRow.name || '',
          description: currentRow.description || '',
          items: currentRow.items?.map(item => ({
            classificationId: item.classificationId,
            plannedAmount: String(item.plannedAmount),
          })) || [],
        })
      } else {
        form.reset({
          year: selectedYear,
          planType: 'PROJEKT',
          name: '',
          description: '',
          items: [],
        })
      }
    }
  }, [open, currentRow, selectedYear, form])

  const onSubmit = async (values: FormValues) => {
    if (!currentUnit || !token) {
      toast.error('Nie wybrano jednostki')
      return
    }

    try {
      const url = isUpdate
        ? `${API_URL}/plans/${currentRow?.id}`
        : `${API_URL}/plans/unit/${currentUnit.id}`
      const method = isUpdate ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          items: values.items?.map(item => ({
            classificationId: item.classificationId,
            plannedAmount: parseFloat(item.plannedAmount),
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd zapisu planu')
      }

      toast.success(isUpdate ? 'Plan zaktualizowany' : 'Plan utworzony')
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Błąd zapisu planu')
    }
  }

  const classificationsByType = {
    DOCHOD: classifications.filter(c => c.type === 'DOCHOD'),
    WYDATEK: classifications.filter(c => c.type === 'WYDATEK'),
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Edytuj plan finansowy' : 'Nowy plan finansowy'}</SheetTitle>
          <SheetDescription>
            {isUpdate ? 'Zaktualizuj dane planu finansowego.' : 'Wprowadź dane nowego planu finansowego.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form id="plan-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rok</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ planu</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PROJEKT">Projekt</SelectItem>
                        <SelectItem value="PLAN_PIERWOTNY">Plan pierwotny</SelectItem>
                        <SelectItem value="PLAN_PO_ZMIANACH">Plan po zmianach</SelectItem>
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
                  <FormLabel>Nazwa (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Plan finansowy na 2024 rok" {...field} />
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
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opcjonalny opis planu..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Journal selection for classifications */}
            <div className="space-y-2">
              <FormLabel>Dziennik (dla klasyfikacji)</FormLabel>
              <Select value={selectedJournalId} onValueChange={setSelectedJournalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz dziennik" />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.shortName} - {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Wybierz dziennik, aby załadować klasyfikacje budżetowe.
              </FormDescription>
            </div>

            {/* Plan items section */}
            {selectedJournalId && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Pozycje planu</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ classificationId: '', plannedAmount: '' })}
                      disabled={classifications.length === 0}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Dodaj pozycję
                    </Button>
                  </div>

                  {classifications.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Brak klasyfikacji budżetowych dla wybranego dziennika. Dodaj klasyfikacje w module "Klasyfikacja budżetowa".
                    </p>
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
                        <CardTitle className="text-sm">Pozycja #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.classificationId`}
                          render={({ field }) => {
                            const selectedCls = classifications.find(c => c.id === field.value)
                            return (
                              <FormItem>
                                <FormLabel className="text-xs">Klasyfikacja budżetowa</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue placeholder="Wybierz klasyfikację">
                                        {selectedCls
                                          ? `${selectedCls.dzial}.${selectedCls.rozdzial}.${selectedCls.paragraf} - ${selectedCls.name}`
                                          : 'Wybierz klasyfikację'}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {classificationsByType.DOCHOD.length > 0 && (
                                      <>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Dochody</div>
                                        {classificationsByType.DOCHOD.map(cls => (
                                          <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                            {cls.dzial}.{cls.rozdzial}.{cls.paragraf} - {cls.name}
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}
                                    {classificationsByType.WYDATEK.length > 0 && (
                                      <>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Wydatki</div>
                                        {classificationsByType.WYDATEK.map(cls => (
                                          <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                            {cls.dzial}.{cls.rozdzial}.{cls.paragraf} - {cls.name}
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.plannedAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Kwota planowana</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
          <Button form="plan-form" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Zapisywanie...' : isUpdate ? 'Zapisz zmiany' : 'Utwórz'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

