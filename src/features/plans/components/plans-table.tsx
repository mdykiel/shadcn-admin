import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
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
import { Eye, Edit, Trash2, FileText, ListPlus } from 'lucide-react'
import { usePlans, type Plan } from './plans-provider'
import { Skeleton } from '@/components/ui/skeleton'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function fetchPlans(unitId: string, year: number, token: string): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/plans/unit/${unitId}?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch plans')
  return res.json()
}

const planTypeLabels: Record<string, string> = {
  PROJEKT: 'Projekt',
  PLAN_PIERWOTNY: 'Plan pierwotny',
  PLAN_PO_ZMIANACH: 'Plan po zmianach',
}

const statusLabels: Record<string, string> = {
  PROJEKT: 'Projekt',
  ZATWIERDZONY: 'Zatwierdzony',
  ARCHIWALNY: 'Archiwalny',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PROJEKT: 'secondary',
  ZATWIERDZONY: 'default',
  ARCHIWALNY: 'outline',
}

export function PlansTable() {
  const { currentUnit, token } = useAuthStore()
  const { setOpen, setCurrentPlan, selectedYear } = usePlans()

  // Check if user is owner of the unit - can edit/delete any plan
  const isOwner = currentUnit?.isUserOwner || currentUnit?.userRole === 'OWNER'

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['plans', currentUnit?.id, selectedYear],
    queryFn: () => fetchPlans(currentUnit!.id, selectedYear, token!),
    enabled: !!currentUnit?.id && !!token,
  })

  if (!currentUnit) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Wybierz jednostkę budżetową, aby zobaczyć plany finansowe.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Błąd ładowania planów: {(error as Error).message}
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Brak planów finansowych dla roku {selectedYear}. Kliknij "Nowy plan", aby utworzyć.
      </div>
    )
  }

  const handleView = (plan: Plan) => {
    setCurrentPlan(plan)
    setOpen('view')
  }

  const handleEdit = (plan: Plan) => {
    setCurrentPlan(plan)
    setOpen('edit')
  }

  const handleDelete = (plan: Plan) => {
    setCurrentPlan(plan)
    setOpen('delete')
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Rok</TableHead>
            <TableHead>Wersja</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pozycji</TableHead>
            <TableHead className="text-right">Zmian</TableHead>
            <TableHead className="text-right">Wniosków</TableHead>
            <TableHead className="w-[150px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name || `Plan ${plan.year}`}</TableCell>
              <TableCell>{plan.year}</TableCell>
              <TableCell>v{plan.version}</TableCell>
              <TableCell>{planTypeLabels[plan.planType] || plan.planType}</TableCell>
              <TableCell>
                <Badge variant={statusColors[plan.status]}>{statusLabels[plan.status]}</Badge>
              </TableCell>
              <TableCell className="text-right">{plan._count?.items || 0}</TableCell>
              <TableCell className="text-right">{plan._count?.changes || 0}</TableCell>
              <TableCell className="text-right">{plan._count?.changeRequests || 0}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleView(plan)} title="Podgląd">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(plan)}
                    title={isOwner ? "Edytuj (właściciel)" : "Edytuj"}
                    disabled={!isOwner && plan.status !== 'PROJEKT'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plan)}
                    title={isOwner ? "Usuń (właściciel)" : "Usuń"}
                    disabled={!isOwner && plan.status !== 'PROJEKT'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

