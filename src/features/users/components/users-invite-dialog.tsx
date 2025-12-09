import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, Send, Loader2, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { usersService } from '@/services/users'
import { useUsers } from './users-provider'

const roleAssignmentSchema = z.object({
  roleId: z.string().min(1, 'Wybierz rolę'),
  journalId: z.string().nullable().optional(),
  fiscalPeriodId: z.string().nullable().optional(),
})

const formSchema = z.object({
  email: z.string().email('Podaj prawidłowy adres email'),
  name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  roleAssignments: z.array(roleAssignmentSchema).default([]),
})

type UserInviteForm = z.infer<typeof formSchema>

type UserInviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const { currentUnit } = useAuthStore()
  const { roles, journals, fiscalPeriods } = useUsers()
  const queryClient = useQueryClient()
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<UserInviteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', name: '', firstName: '', lastName: '', phone: '', roleAssignments: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'roleAssignments',
  })

  const createMutation = useMutation({
    mutationFn: (data: UserInviteForm) => usersService.create(currentUnit!.id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUnit?.id] })
      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword)
        toast.success('Użytkownik został utworzony')
      } else {
        toast.success('Użytkownik został utworzony')
        form.reset()
        onOpenChange(false)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Błąd podczas tworzenia użytkownika')
    },
  })

  const onSubmit = (values: UserInviteForm) => {
    createMutation.mutate(values)
  }

  const addRoleAssignment = () => {
    append({ roleId: '', journalId: null, fiscalPeriodId: null })
  }

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    form.reset()
    setGeneratedPassword(null)
    setCopied(false)
    onOpenChange(false)
  }

  if (generatedPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle className='flex items-center gap-2'>
              <UserPlus /> Użytkownik utworzony
            </DialogTitle>
            <DialogDescription>
              Przekaż poniższe hasło użytkownikowi. Hasło jest wyświetlane tylko raz.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex items-center gap-2 p-3 bg-muted rounded-md'>
              <code className='flex-1 font-mono text-sm'>{generatedPassword}</code>
              <Button variant='ghost' size='icon' onClick={handleCopyPassword}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus /> Dodaj użytkownika
          </DialogTitle>
          <DialogDescription>
            Dodaj nowego użytkownika do jednostki. Hasło zostanie wygenerowane automatycznie.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='user-invite-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='jan.kowalski@example.com' {...field} />
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
                  <FormLabel>Imię i nazwisko *</FormLabel>
                  <FormControl>
                    <Input placeholder='Jan Kowalski' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder='+48 123 456 789' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Role Assignments */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <FormLabel>Przypisania ról</FormLabel>
                <Button type='button' variant='outline' size='sm' onClick={addRoleAssignment}>
                  <Plus className='h-4 w-4 mr-1' /> Dodaj rolę
                </Button>
              </div>

              {fields.length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  Kliknij "Dodaj rolę" aby przypisać uprawnienia
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className='border rounded-lg p-3 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Rola #{index + 1}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6'
                      onClick={() => remove(index)}
                    >
                      <Trash2 className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`roleAssignments.${index}.roleId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>Rola *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Wybierz rolę' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-2'>
                    <FormField
                      control={form.control}
                      name={`roleAssignments.${index}.journalId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Dziennik</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === 'all' ? null : v)}
                            value={field.value || 'all'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Wszystkie' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='all'>Wszystkie</SelectItem>
                              {journals.map((journal) => (
                                <SelectItem key={journal.id} value={journal.id}>
                                  {journal.shortName} - {journal.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`roleAssignments.${index}.fiscalPeriodId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Okres obrachunkowy</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === 'all' ? null : v)}
                            value={field.value || 'all'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Wszystkie' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='all'>Wszystkie</SelectItem>
                              {fiscalPeriods.map((period) => (
                                <SelectItem key={period.id} value={period.id}>
                                  {period.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Anuluj</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form' disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Dodaj <Send className='ml-1' size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
