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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth-store'
import { rolesService, PERMISSION_MODULES } from '@/services/roles'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

const formSchema = z.object({
  name: z.string().min(1, 'Nazwa roli jest wymagana'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
})

type RoleForm = z.infer<typeof formSchema>

type RolesMutateDialogProps = {
  currentRow?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesMutateDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesMutateDialogProps) {
  const { currentUnit } = useAuthStore()
  const { permissionsGrouped } = useRoles()
  const queryClient = useQueryClient()
  const isEdit = !!currentRow

  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          description: currentRow.description || '',
          permissionIds: currentRow.permissions?.map((p) => p.id) || [],
        }
      : {
          name: '',
          description: '',
          permissionIds: [],
        },
  })

  const createMutation = useMutation({
    mutationFn: (data: RoleForm) => rolesService.create(currentUnit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', currentUnit?.id] })
      toast.success('Rola została utworzona')
      form.reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas tworzenia roli')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: RoleForm) =>
      rolesService.update(currentUnit!.id, currentRow!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', currentUnit?.id] })
      toast.success('Rola została zaktualizowana')
      form.reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas aktualizacji roli')
    },
  })

  const onSubmit = (values: RoleForm) => {
    if (isEdit) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edytuj rolę' : 'Dodaj nową rolę'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Zaktualizuj dane roli i uprawnienia.'
              : 'Utwórz nową rolę i przypisz uprawnienia.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='role-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa roli</FormLabel>
                  <FormControl>
                    <Input placeholder='np. Księgowy' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Opis roli i jej uprawnień...'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='permissionIds'
              render={() => (
                <FormItem>
                  <FormLabel>Uprawnienia</FormLabel>
                  <ScrollArea className='h-[300px] rounded-md border p-4'>
                    <div className='space-y-6'>
                      {Object.entries(PERMISSION_MODULES).map(([moduleKey, moduleName]) => {
                        const modulePermissions = permissionsGrouped[moduleKey] || []
                        if (modulePermissions.length === 0) return null

                        return (
                          <div key={moduleKey} className='space-y-2'>
                            <h4 className='font-medium text-sm text-muted-foreground uppercase tracking-wide'>
                              {moduleName}
                            </h4>
                            <div className='grid grid-cols-2 gap-2'>
                              {modulePermissions.map((permission) => (
                                <FormField
                                  key={permission.id}
                                  control={form.control}
                                  name='permissionIds'
                                  render={({ field }) => (
                                    <FormItem className='flex items-center space-x-2 space-y-0'>
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission.id)}
                                          onCheckedChange={(checked) => {
                                            const current = field.value || []
                                            if (checked) {
                                              field.onChange([...current, permission.id])
                                            } else {
                                              field.onChange(current.filter((id) => id !== permission.id))
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className='font-normal cursor-pointer text-sm'>
                                        {permission.name}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='role-form' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Zapisz zmiany' : 'Utwórz rolę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

