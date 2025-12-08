import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { fiscalPeriodService, FiscalPeriod } from '@/services/fiscal-periods'
import { useAuthStore } from '@/store/auth'

const formSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  startDate: z.string().min(1, 'Data początkowa jest wymagana'),
  endDate: z.string().min(1, 'Data końcowa jest wymagana'),
  isActive: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: FiscalPeriod | null
}

export function FiscalPeriodMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const { currentUnit } = useAuthStore()
  const unitId = currentUnit?.id || ''
  const queryClient = useQueryClient()
  const isEdit = !!currentRow

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      isActive: false,
    },
  })

  useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name,
        startDate: currentRow.startDate.split('T')[0],
        endDate: currentRow.endDate.split('T')[0],
        isActive: currentRow.isActive,
      })
    } else {
      const year = new Date().getFullYear()
      form.reset({
        name: `Rok ${year}`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        isActive: false,
      })
    }
  }, [currentRow, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        return fiscalPeriodService.update(currentRow.id, values)
      }
      return fiscalPeriodService.create({ ...values, unitId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      toast.success(isEdit ? 'Okres zaktualizowany' : 'Okres utworzony')
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Wystąpił błąd')
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isEdit ? 'Edytuj okres obrachunkowy' : 'Dodaj okres obrachunkowy'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Zmień dane okresu obrachunkowego.' : 'Utwórz nowy okres obrachunkowy dla jednostki.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='fiscal-period-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto p-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa okresu</FormLabel>
                  <FormControl>
                    <Input placeholder='np. Rok 2024' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data początkowa</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data końcowa</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <div>
                    <FormLabel>Ustaw jako aktywny</FormLabel>
                    <p className='text-sm text-muted-foreground'>
                      Tylko jeden okres może być aktywny w danym momencie.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='gap-2 pt-2'>
          <SheetClose asChild>
            <Button variant='outline'>Anuluj</Button>
          </SheetClose>
          <Button form='fiscal-period-form' type='submit' disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Zapisz zmiany' : 'Dodaj okres'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

