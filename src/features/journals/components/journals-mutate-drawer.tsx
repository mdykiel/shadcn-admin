import { useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Journal } from '@/types/auth'
import { useAuthStore } from '@/store/auth'
import { journalService } from '@/services/journals'

const formSchema = z.object({
  name: z.string().min(2, 'Nazwa musi mieć min. 2 znaki'),
  shortName: z.string().min(2, 'Skrót musi mieć min. 2 znaki').max(5, 'Skrót może mieć max. 5 znaków'),
  type: z.enum(['BUDZET', 'WRD', 'ZFSS', 'INNY']),
  description: z.string().optional(),
  requiresClassification: z.boolean(),
  hasOwnAccountPlan: z.boolean(),
  hasFinancialPlan: z.boolean(),
  isDefault: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface JournalsMutateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Journal | null
}

export function JournalsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: JournalsMutateDrawerProps) {
  const { currentUnit } = useAuthStore()
  const isUpdate = !!currentRow

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      shortName: '',
      type: 'INNY',
      description: '',
      requiresClassification: true,
      hasOwnAccountPlan: true,
      hasFinancialPlan: true,
      isDefault: false,
    },
  })

  // Reset form when currentRow changes
  useEffect(() => {
    if (open) {
      if (currentRow) {
        form.reset({
          name: currentRow.name,
          shortName: currentRow.shortName,
          type: currentRow.type,
          description: currentRow.description || '',
          requiresClassification: currentRow.requiresClassification,
          hasOwnAccountPlan: currentRow.hasOwnAccountPlan,
          hasFinancialPlan: currentRow.hasFinancialPlan,
          isDefault: currentRow.isDefault,
        })
      } else {
        form.reset({
          name: '',
          shortName: '',
          type: 'INNY',
          description: '',
          requiresClassification: true,
          hasOwnAccountPlan: true,
          hasFinancialPlan: true,
          isDefault: false,
        })
      }
    }
  }, [open, currentRow, form])

  const onSubmit = async (values: FormValues) => {
    if (!currentUnit) return

    try {
      if (isUpdate && currentRow) {
        await journalService.update(currentUnit.id, currentRow.id, values)
        toast.success('Dziennik został zaktualizowany')
      } else {
        await journalService.create(currentUnit.id, values)
        toast.success('Dziennik został dodany')
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
          <SheetTitle>{isUpdate ? 'Edytuj dziennik' : 'Dodaj dziennik'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Zaktualizuj ustawienia dziennika.'
              : 'Wprowadź dane nowego dziennika.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form id='journal-form' onSubmit={form.handleSubmit(onSubmit)} className='flex-1 space-y-4 overflow-y-auto p-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa</FormLabel>
                  <FormControl>
                    <Input placeholder='np. Budżet' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='shortName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skrót (2-5 znaków)</FormLabel>
                  <FormControl>
                    <Input placeholder='np. BUD' {...field} />
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
                  <FormLabel>Typ dziennika</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Wybierz typ' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='BUDZET'>Budżet</SelectItem>
                      <SelectItem value='WRD'>Wydzielony Rachunek Dochodów</SelectItem>
                      <SelectItem value='ZFSS'>Zakładowy Fundusz Świadczeń Socjalnych</SelectItem>
                      <SelectItem value='INNY'>Inny</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Opis dziennika...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className='space-y-4 rounded-lg border p-4'>
              <h4 className='font-medium'>Ustawienia dziennika</h4>
              
              <FormField
                control={form.control}
                name='requiresClassification'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel>Wymaga klasyfikacji budżetowej</FormLabel>
                      <FormDescription>
                        Czy operacje wymagają przypisania klasyfikacji
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='hasOwnAccountPlan'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel>Własny plan kont</FormLabel>
                      <FormDescription>
                        Czy dziennik ma osobny plan kont
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='hasFinancialPlan'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel>Plan finansowy</FormLabel>
                      <FormDescription>
                        Czy dziennik posiada plan finansowy
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Anuluj</Button>
          </SheetClose>
          <Button form='journal-form' type='submit'>
            {isUpdate ? 'Zapisz zmiany' : 'Dodaj'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

