'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SelectDropdown } from '@/components/select-dropdown'
import { useAuthStore } from '@/stores/auth-store'
import { usersService } from '@/services/users'
import { statusOptions } from '../data/data'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

const formSchema = z.object({
  name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED']),
  roleIds: z.array(z.string()).default([]),
})

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const { currentUnit } = useAuthStore()
  const { roles } = useUsers()
  const queryClient = useQueryClient()
  const isEdit = !!currentRow

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          firstName: currentRow.firstName || '',
          lastName: currentRow.lastName || '',
          phone: currentRow.phone || '',
          status: currentRow.status,
          roleIds: currentRow.roles?.map((r) => r.id) || [],
        }
      : {
          name: '',
          firstName: '',
          lastName: '',
          phone: '',
          status: 'ACTIVE',
          roleIds: [],
        },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UserForm) =>
      usersService.update(currentUnit!.id, currentRow!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUnit?.id] })
      toast.success('Użytkownik został zaktualizowany')
      form.reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas aktualizacji użytkownika')
    },
  })

  const onSubmit = (values: UserForm) => {
    updateMutation.mutate(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Edytuj użytkownika</DialogTitle>
          <DialogDescription>
            Zaktualizuj dane użytkownika. Kliknij zapisz gdy skończysz.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Imię i nazwisko
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Jan Kowalski'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Telefon
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+48 123 456 789'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Status</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Wybierz status'
                      className='col-span-4'
                      items={statusOptions.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              {roles.length > 0 && (
                <FormField
                  control={form.control}
                  name='roleIds'
                  render={() => (
                    <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end pt-2'>Role</FormLabel>
                      <div className='col-span-4 space-y-2'>
                        {roles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name='roleIds'
                            render={({ field }) => (
                              <FormItem className='flex items-center space-x-2 space-y-0'>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || []
                                      if (checked) {
                                        field.onChange([...current, role.id])
                                      } else {
                                        field.onChange(current.filter((id) => id !== role.id))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className='font-normal cursor-pointer'>
                                  {role.name}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
