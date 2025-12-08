import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { budgetUnitsService } from '@/services/budget-units'
import { useAuthStore } from '@/store/auth'
import { BudgetUnit } from '@/types/auth'

const formSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100, 'Nazwa może mieć maksymalnie 100 znaków'),
  shortName: z.string().max(20, 'Skrót może mieć maksymalnie 20 znaków').optional().or(z.literal('')),
  regon: z.string().max(14, 'REGON może mieć maksymalnie 14 znaków').optional().or(z.literal('')),
  nip: z.string().max(13, 'NIP może mieć maksymalnie 13 znaków').optional().or(z.literal('')),
  unitType: z.enum(['JEDNOSTKA_BUDZETOWA', 'ZAKLAD_BUDZETOWY', 'ORGAN_BUDZETU']),
  defaultDzial: z.string().max(10, 'Dział może mieć maksymalnie 10 znaków').optional().or(z.literal('')),
  defaultRozdzial: z.string().max(20, 'Rozdział może mieć maksymalnie 20 znaków').optional().or(z.literal('')),
  createDefaultJournals: z.boolean().default(true),
})

type BudgetUnitForm = z.infer<typeof formSchema>

type BudgetUnitMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: BudgetUnit
}

export function BudgetUnitMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: BudgetUnitMutateDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addUnit, loadUnits } = useAuthStore()
  const isUpdate = !!currentRow

  const form = useForm<BudgetUnitForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow ? {
      name: currentRow.name,
      shortName: currentRow.shortName || '',
      regon: currentRow.regon || '',
      nip: currentRow.nip || '',
      unitType: currentRow.unitType,
      defaultDzial: currentRow.defaultDzial || '',
      defaultRozdzial: currentRow.defaultRozdzial || '',
      createDefaultJournals: true,
    } : {
      name: '',
      shortName: '',
      regon: '',
      nip: '',
      unitType: 'JEDNOSTKA_BUDZETOWA',
      defaultDzial: '',
      defaultRozdzial: '',
      createDefaultJournals: true,
    },
  })

  const onSubmit = async (data: BudgetUnitForm) => {
    setIsLoading(true)

    try {
      // Convert empty strings to undefined
      const cleanData = {
        ...data,
        shortName: data.shortName || undefined,
        regon: data.regon || undefined,
        nip: data.nip || undefined,
        defaultDzial: data.defaultDzial || undefined,
        defaultRozdzial: data.defaultRozdzial || undefined,
        createDefaultJournals: isUpdate ? undefined : data.createDefaultJournals,
      }

      if (isUpdate && currentRow) {
        const updatedUnit = await budgetUnitsService.update(currentRow.id, cleanData)
        await loadUnits() // Reload units after update
        toast.success('Jednostka została zaktualizowana pomyślnie')
      } else {
        const newUnit = await budgetUnitsService.create(cleanData)
        addUnit(newUnit)
        toast.success('Jednostka została utworzona pomyślnie')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      console.error('Unit mutation error:', error)
      toast.error(error.response?.data?.message || 'Błąd podczas zapisywania jednostki')
    } finally {
      setIsLoading(false)
    }
  }

  const unitTypeLabels = {
    JEDNOSTKA_BUDZETOWA: 'Jednostka budżetowa',
    ZAKLAD_BUDZETOWY: 'Zakład budżetowy',
    ORGAN_BUDZETU: 'Organ budżetu (JST)',
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
            {isUpdate ? 'Edytuj' : 'Utwórz'} jednostkę budżetową
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Zaktualizuj dane jednostki budżetowej.'
              : 'Dodaj nową jednostkę budżetową do zarządzania finansami.'}
            Kliknij zapisz, gdy skończysz.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='budget-unit-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-2'
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa jednostki *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Szkoła Podstawowa nr 5" {...field} />
                  </FormControl>
                  <FormDescription>
                    Pełna nazwa jednostki budżetowej
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skrót</FormLabel>
                    <FormControl>
                      <Input placeholder="np. SP5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ jednostki *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz typ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(unitTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="regon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>REGON</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 12345678901234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 123-456-78-90" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultDzial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domyślny dział</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 801" {...field} />
                    </FormControl>
                    <FormDescription>
                      Klasyfikacja budżetowa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultRozdzial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domyślny rozdział</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 80101" {...field} />
                    </FormControl>
                    <FormDescription>
                      Klasyfikacja budżetowa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isUpdate && (
              <FormField
                control={form.control}
                name="createDefaultJournals"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Utwórz domyślne dzienniki
                      </FormLabel>
                      <FormDescription>
                        Automatycznie utworzy dzienniki: Budżet, WRD, ZFŚS
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Anuluj</Button>
          </SheetClose>
          <Button
            form='budget-unit-form'
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