import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Shield, Users } from 'lucide-react'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

type RolesTableProps = {
  data: Role[]
}

export function RolesTable({ data }: RolesTableProps) {
  const { setOpen, setCurrentRow } = useRoles()

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[250px]'>Nazwa roli</TableHead>
            <TableHead>Opis</TableHead>
            <TableHead className='w-[120px] text-center'>Uprawnienia</TableHead>
            <TableHead className='w-[120px] text-center'>Użytkownicy</TableHead>
            <TableHead className='w-[100px] text-center'>Typ</TableHead>
            <TableHead className='w-[70px]'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='h-24 text-center'>
                Brak ról. Dodaj pierwszą rolę.
              </TableCell>
            </TableRow>
          ) : (
            data.map((role) => (
              <TableRow key={role.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <Shield className='h-4 w-4 text-muted-foreground' />
                    {role.name}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {role.description || '-'}
                </TableCell>
                <TableCell className='text-center'>
                  <Badge variant='secondary'>
                    {role.permissions?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className='text-center'>
                  <div className='flex items-center justify-center gap-1'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    {role._count?.users || 0}
                  </div>
                </TableCell>
                <TableCell className='text-center'>
                  {role.isSystem ? (
                    <Badge variant='outline'>Systemowa</Badge>
                  ) : (
                    <Badge variant='secondary'>Własna</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentRow(role)
                          setOpen('edit')
                        }}
                      >
                        <Pencil className='mr-2 h-4 w-4' />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentRow(role)
                          setOpen('delete')
                        }}
                        className='text-red-500'
                        disabled={role.isSystem}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

