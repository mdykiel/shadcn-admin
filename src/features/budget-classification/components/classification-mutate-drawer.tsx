import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { BudgetClassification, Journal } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'
import { journalService } from '@/services/journals'

const formSchema = z.object({
  journalId: z.string().min(1, 'Dziennik jest wymagany'),
  dzial: z.string().min(3, 'Dział musi mieć min. 3 cyfry').max(3, 'Dział musi mieć max. 3 cyfry'),
  rozdzial: z.string().min(5, 'Rozdział musi mieć min. 5 cyfr').max(5, 'Rozdział musi mieć max. 5 cyfr'),
  paragraf: z.string().min(4, 'Paragraf musi mieć min. 4 cyfry').max(4, 'Paragraf musi mieć max. 4 cyfry'),
  podparagraf: z.string().max(2, 'Podparagraf może mieć max. 2 cyfry').optional().or(z.literal('')),
  name: z.string().min(3, 'Nazwa musi mieć min. 3 znaki'),
  type: z.enum(['DOCHOD', 'WYDATEK', 'PRZYCHOD', 'ROZCHOD']),
})

type FormValues = z.infer<typeof formSchema>

interface ClassificationMutateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: BudgetClassification | null
  defaultJournalId?: string
}

export function ClassificationMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  defaultJournalId,
}: ClassificationMutateDrawerProps) {
  const { currentUnit } = useAuthStore()
  const [journals, setJournals] = useState<Journal[]>([])
  const isUpdate = !!currentRow

  // Load journals for selection - show all active journals
  useEffect(() => {
    const loadJournals = async () => {
      if (!currentUnit) return
      try {
        const journalsList = await journalService.getActive(currentUnit.id)
        setJournals(journalsList)
      } catch (error) {
        console.error('Error loading journals:', error)
      }
    }
    if (open) {
      loadJournals()
    }
  }, [currentUnit, open])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          journalId: currentRow.journalId,
          dzial: currentRow.dzial,
          rozdzial: currentRow.rozdzial,
          paragraf: currentRow.paragraf,
          podparagraf: currentRow.podparagraf || '',
          name: currentRow.name,
          type: currentRow.type,
        }
      : {
          journalId: defaultJournalId || '',
          dzial: '',
          rozdzial: '',
          paragraf: '',
          podparagraf: '',
          name: '',
          type: 'WYDATEK',
        },
  })

  // Reset form when currentRow or open changes
  useEffect(() => {
    if (open) {
      if (currentRow) {
        form.reset({
          journalId: currentRow.journalId,
          dzial: currentRow.dzial,
          rozdzial: currentRow.rozdzial,
          paragraf: currentRow.paragraf,
          podparagraf: currentRow.podparagraf || '',
          name: currentRow.name,
          type: currentRow.type,
        })
      } else {
        form.reset({
          journalId: defaultJournalId || '',
          dzial: '',
          rozdzial: '',
          paragraf: '',
          podparagraf: '',
          name: '',
          type: 'WYDATEK',
        })
      }
    }
  }, [currentRow, open, defaultJournalId, form])

  const onSubmit = async (values: FormValues) => {
    if (!currentUnit) return

    try {
      if (isUpdate && currentRow) {
        await budgetClassificationService.update(currentUnit.id, currentRow.id, values)
        toast.success('Klasyfikacja została zaktualizowana')
      } else {
        await budgetClassificationService.create(currentUnit.id, values)
        toast.success('Klasyfikacja została dodana')
      }
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Wystąpił błąd')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Edytuj klasyfikację' : 'Dodaj klasyfikację'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Zaktualizuj klasyfikację budżetową.'
              : 'Wprowadź dane nowej klasyfikacji budżetowej.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form id='classification-form' onSubmit={form.handleSubmit(onSubmit)} className='flex-1 space-y-4 p-4'>
            {/* Journal selection */}
            <FormField
              control={form.control}
              name='journalId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dziennik *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Wybierz dziennik' />
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
                  <FormDescription>
                    Klasyfikacja będzie przypisana do wybranego dziennika
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dzial'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dział (3 cyfry)</FormLabel>
                  <FormControl>
                    <Input placeholder='np. 801' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='rozdzial'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rozdział (5 cyfr)</FormLabel>
                  <FormControl>
                    <Input placeholder='np. 80101' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='paragraf'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paragraf (4 cyfry)</FormLabel>
                  <FormControl>
                    <Input placeholder='np. 4010' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='podparagraf'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podparagraf (opcjonalnie, max 2 cyfry)</FormLabel>
                  <FormControl>
                    <Input placeholder='np. 01' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa</FormLabel>
                  <FormControl>
                    <Input placeholder='np. Wynagrodzenia osobowe pracowników' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ klasyfikacji</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Wybierz typ' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='DOCHOD'>Dochód</SelectItem>
                      <SelectItem value='WYDATEK'>Wydatek</SelectItem>
                      <SelectItem value='PRZYCHOD'>Przychód</SelectItem>
                      <SelectItem value='ROZCHOD'>Rozchód</SelectItem>
                    </SelectContent>
                  </Select>
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
          <Button form='classification-form' type='submit'>
            {isUpdate ? 'Zapisz zmiany' : 'Dodaj'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

