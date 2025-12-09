import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Save, X, Edit2, CheckCircle, FileEdit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import { budgetClassificationService } from '@/services/budget-classification'
import { journalService } from '@/services/journals'
import type { BudgetClassification, Journal } from '@/types/auth'
import { type Plan, type PlanItem, usePlans } from './plans-provider'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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

const typeLabels: Record<string, string> = {
  DOCHOD: 'Dochód',
  WYDATEK: 'Wydatek',
}

interface PlanViewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
  onSuccess?: () => void
}

interface EditingItem {
  classificationId: string
  plannedAmount: string
  isNew?: boolean
  originalId?: string
}

export function PlanViewSheet({ open, onOpenChange, plan, onSuccess }: PlanViewSheetProps) {
  const { currentUnit, token, user } = useAuthStore()
  const queryClient = useQueryClient()

  // Check if user is owner - can edit/delete any plan regardless of status
  const isOwner = currentUnit?.isUserOwner || currentUnit?.userRole === 'OWNER'

  const [journals, setJournals] = useState<Journal[]>([])
  const [selectedJournalId, setSelectedJournalId] = useState<string>('')
  const [classifications, setClassifications] = useState<BudgetClassification[]>([])
  const [editingItems, setEditingItems] = useState<EditingItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // For change request mode
  const [isChangeRequestMode, setIsChangeRequestMode] = useState(false)
  const [changeRequestReason, setChangeRequestReason] = useState('')
  const [showReasonDialog, setShowReasonDialog] = useState(false)

  // Fetch plan with items
  const { data: fullPlan, isLoading } = useQuery({
    queryKey: ['plan', plan?.id],
    queryFn: async () => {
      if (!plan?.id || !token) return null
      const res = await fetch(`${API_URL}/plans/${plan.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Błąd pobierania planu')
      return res.json() as Promise<Plan>
    },
    enabled: open && !!plan?.id && !!token,
  })

  // Fetch change requests for this plan
  const { data: changeRequests = [], refetch: refetchChangeRequests } = useQuery({
    queryKey: ['plan-change-requests', plan?.id],
    queryFn: async () => {
      if (!plan?.id || !token) return []
      const res = await fetch(`${API_URL}/plans/${plan.id}/change-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: open && !!plan?.id && !!token && plan?.status === 'ZATWIERDZONY',
  })

  // Load journals and optionally select first one
  const loadJournals = async (autoSelectFirst = false) => {
    if (!currentUnit?.id) return
    try {
      const data = await journalService.getActive(currentUnit.id)
      setJournals(data)
      if (autoSelectFirst && data.length > 0) {
        const firstJournalId = data[0].id
        setSelectedJournalId(firstJournalId)
        // Load classifications for first journal
        await loadClassificationsForJournal(firstJournalId)
      }
    } catch (err) {
      console.error('Error loading journals:', err)
    }
  }

  // Load classifications for a specific journal
  const loadClassificationsForJournal = async (journalId: string) => {
    if (!currentUnit?.id) return
    try {
      const data = await budgetClassificationService.getByJournal(currentUnit.id, journalId)
      setClassifications(data)
    } catch (err) {
      console.error('Error loading classifications:', err)
    }
  }

  // Load classifications when journal selected
  const handleJournalChange = async (journalId: string) => {
    setSelectedJournalId(journalId)
    await loadClassificationsForJournal(journalId)
  }

  const startEditing = async () => {
    const items = fullPlan?.items || []
    setEditingItems(items.map(item => ({
      classificationId: item.classificationId,
      plannedAmount: String(item.plannedAmount),
      originalId: item.id,
    })))
    setIsEditing(true)
    // Load journals and auto-select first one to load classifications
    await loadJournals(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditingItems([])
    setSelectedJournalId('')
    setClassifications([])
  }

  const addNewItem = () => {
    setEditingItems([...editingItems, { classificationId: '', plannedAmount: '', isNew: true }])
  }

  const removeItem = (index: number) => {
    setEditingItems(editingItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'classificationId' | 'plannedAmount', value: string) => {
    const updated = [...editingItems]
    updated[index] = { ...updated[index], [field]: value }
    setEditingItems(updated)
  }

  const saveItems = async () => {
    if (!plan?.id || !token) return

    // Validate - unique classifications
    const classIds = editingItems.map(i => i.classificationId).filter(Boolean)
    if (new Set(classIds).size !== classIds.length) {
      toast.error('Każda klasyfikacja może być użyta tylko raz')
      return
    }

    // Validate - all fields filled
    const validItems = editingItems.filter(i => i.classificationId && i.plannedAmount)

    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: validItems.map(item => ({
            classificationId: item.classificationId,
            plannedAmount: parseFloat(item.plannedAmount),
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd zapisu')
      }

      toast.success('Pozycje planu zapisane')
      queryClient.invalidateQueries({ queryKey: ['plan', plan.id] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setIsEditing(false)
      setEditingItems([])
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Błąd zapisu pozycji')
    } finally {
      setIsSaving(false)
    }
  }

  // Approve plan (PROJEKT -> ZATWIERDZONY)
  const approvePlan = async () => {
    if (!plan?.id || !token) return

    setIsApproving(true)
    try {
      const res = await fetch(`${API_URL}/plans/${plan.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approvedBy: user?.name || user?.email || 'System' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd zatwierdzania')
      }

      toast.success('Plan został zatwierdzony')
      queryClient.invalidateQueries({ queryKey: ['plan', plan.id] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Błąd zatwierdzania planu')
    } finally {
      setIsApproving(false)
    }
  }

  // Start change request mode
  const startChangeRequest = async () => {
    await loadJournals(true)
    const items = fullPlan?.items || []
    // Use currentAmount as base for changes
    setEditingItems(items.map(item => ({
      classificationId: item.classificationId,
      plannedAmount: String(item.currentAmount),
      originalId: item.id,
    })))
    setIsChangeRequestMode(true)
    setIsEditing(true)
  }

  // Cancel change request
  const cancelChangeRequest = () => {
    setIsEditing(false)
    setIsChangeRequestMode(false)
    setEditingItems([])
    setSelectedJournalId('')
    setClassifications([])
    setChangeRequestReason('')
  }

  // Save change request (show reason dialog first)
  const prepareChangeRequest = () => {
    // Validate - unique classifications
    const classIds = editingItems.map(i => i.classificationId).filter(Boolean)
    if (new Set(classIds).size !== classIds.length) {
      toast.error('Każda klasyfikacja może być użyta tylko raz')
      return
    }

    // Check if there are actual changes
    const items = fullPlan?.items || []
    const hasChanges = editingItems.some(editItem => {
      const original = items.find(i => i.classificationId === editItem.classificationId)
      if (!original) return !!editItem.classificationId // New item
      return parseFloat(String(original.currentAmount)) !== parseFloat(editItem.plannedAmount)
    })

    if (!hasChanges) {
      toast.error('Nie wprowadzono żadnych zmian')
      return
    }

    setShowReasonDialog(true)
  }

  // Submit change request
  const submitChangeRequest = async () => {
    if (!plan?.id || !token || !changeRequestReason.trim()) {
      toast.error('Wprowadź uzasadnienie wniosku')
      return
    }

    const items = fullPlan?.items || []
    const validItems = editingItems.filter(i => i.classificationId && i.plannedAmount)

    // Calculate differences
    const details = validItems.map(editItem => {
      const original = items.find(i => i.classificationId === editItem.classificationId)
      const currentAmount = original ? parseFloat(String(original.currentAmount)) : 0
      const requestedAmount = parseFloat(editItem.plannedAmount)

      return {
        classificationId: editItem.classificationId,
        currentAmount,
        requestedAmount,
      }
    }).filter(d => d.currentAmount !== d.requestedAmount || d.currentAmount === 0) // Only changed or new items

    if (details.length === 0) {
      toast.error('Nie wprowadzono żadnych zmian')
      return
    }

    // Generate request number
    const now = new Date()
    const requestNumber = `WZ/${plan.year}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/plans/${plan.id}/change-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestNumber,
          requestedBy: user?.name || user?.email || 'System',
          reason: changeRequestReason,
          details,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd tworzenia wniosku')
      }

      toast.success('Wniosek o zmianę został utworzony')
      queryClient.invalidateQueries({ queryKey: ['plan', plan.id] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests', plan.id] })
      setShowReasonDialog(false)
      cancelChangeRequest()
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Błąd tworzenia wniosku')
    } finally {
      setIsSaving(false)
    }
  }

  // Approve a change request
  const approveChangeRequestFn = async (requestId: string) => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/plans/change-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approvedBy: user?.name || user?.email || 'System' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd zatwierdzania wniosku')
      }

      toast.success('Wniosek zatwierdzony - utworzono nowy plan')
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests'] })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Błąd zatwierdzania wniosku')
    }
  }

  // Delete a change request
  const deleteChangeRequest = async (requestId: string) => {
    if (!token || !plan?.id) return

    try {
      const res = await fetch(`${API_URL}/plans/change-requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd usuwania wniosku')
      }

      toast.success('Wniosek został usunięty')
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests', plan.id] })
    } catch (err: any) {
      toast.error(err.message || 'Błąd usuwania wniosku')
    }
  }

  // Submit a change request (DRAFT -> SUBMITTED)
  const submitChangeRequestFn = async (requestId: string) => {
    if (!token || !plan?.id) return

    try {
      const res = await fetch(`${API_URL}/plans/change-requests/${requestId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Błąd składania wniosku')
      }

      toast.success('Wniosek został złożony')
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests', plan.id] })
    } catch (err: any) {
      toast.error(err.message || 'Błąd składania wniosku')
    }
  }

  // Edit a change request - load its data into editing mode
  const editChangeRequest = async (request: any) => {
    await loadJournals(true)

    // Load items from the request details
    setEditingItems(request.details.map((d: any) => ({
      classificationId: d.classificationId,
      plannedAmount: String(d.requestedAmount),
      originalId: d.id,
    })))

    setChangeRequestReason(request.reason)
    setIsChangeRequestMode(true)
    setIsEditing(true)

    // Delete the old request after loading - we'll create a new one on save
    // Actually, let's just update it - but for simplicity, delete and recreate
    await deleteChangeRequest(request.id)
  }

  const formatAmount = (amount: string | number) => {
    return parseFloat(String(amount)).toLocaleString('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    })
  }

  const getClassificationLabel = (item: PlanItem) => {
    const cls = item.classification
    return `${cls.dzial}.${cls.rozdzial}.${cls.paragraf}${cls.podparagraf ? `.${cls.podparagraf}` : ''}`
  }

  const usedClassificationIds = new Set(editingItems.map(i => i.classificationId).filter(Boolean))

  if (!plan) return null

  const items = fullPlan?.items || []
  const incomeItems = items.filter(i => i.classification.type === 'DOCHOD')
  const expenseItems = items.filter(i => i.classification.type === 'WYDATEK')

  // Calculate totals for income
  const incomePlanned = incomeItems.reduce((sum, i) => sum + parseFloat(String(i.plannedAmount)), 0)
  const incomeCurrent = incomeItems.reduce((sum, i) => sum + parseFloat(String(i.currentAmount)), 0)
  const incomeExecuted = incomeItems.reduce((sum, i) => sum + parseFloat(String(i.executedAmount)), 0)

  // Calculate totals for expense
  const expensePlanned = expenseItems.reduce((sum, i) => sum + parseFloat(String(i.plannedAmount)), 0)
  const expenseCurrent = expenseItems.reduce((sum, i) => sum + parseFloat(String(i.currentAmount)), 0)
  const expenseExecuted = expenseItems.reduce((sum, i) => sum + parseFloat(String(i.executedAmount)), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-4xl w-full p-0">
        <SheetHeader className="text-left px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            {plan.name || `Plan finansowy ${plan.year}`}
            <Badge variant={statusColors[plan.status]}>{statusLabels[plan.status]}</Badge>
          </SheetTitle>
          <SheetDescription>
            {planTypeLabels[plan.planType]} • Rok {plan.year} • Wersja {plan.version}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6">
          {/* Summary cards - Income and Expense */}
          <div className="grid grid-cols-2 gap-4">
            {/* Income summary */}
            <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">Dochody</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-semibold">{formatAmount(incomePlanned)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Po zmianach</p>
                  <p className="font-semibold">{formatAmount(incomeCurrent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wykonanie</p>
                  <p className="font-semibold">{formatAmount(incomeExecuted)}</p>
                </div>
              </div>
            </div>

            {/* Expense summary */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">Wydatki</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-semibold">{formatAmount(expensePlanned)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Po zmianach</p>
                  <p className="font-semibold">{formatAmount(expenseCurrent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wykonanie</p>
                  <p className="font-semibold">{formatAmount(expenseExecuted)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold">Pozycje planu ({items.length})</h3>
            <div className="flex gap-2 flex-wrap">
              {/* PROJEKT status - can edit directly and approve */}
              {plan.status === 'PROJEKT' && !isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Edit2 className="mr-1 h-4 w-4" /> Edytuj pozycje
                  </Button>
                  {items.length > 0 && (
                    <Button size="sm" onClick={approvePlan} disabled={isApproving}>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      {isApproving ? 'Zatwierdzanie...' : 'Zatwierdź plan'}
                    </Button>
                  )}
                </>
              )}

              {/* ZATWIERDZONY status - change request for regular users */}
              {plan.status === 'ZATWIERDZONY' && !isEditing && !isOwner && (
                <Button variant="outline" size="sm" onClick={startChangeRequest}>
                  <FileEdit className="mr-1 h-4 w-4" /> Wniosek o zmianę
                </Button>
              )}

              {/* ZATWIERDZONY status - direct edit for owner */}
              {plan.status === 'ZATWIERDZONY' && !isEditing && isOwner && (
                <>
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Edit2 className="mr-1 h-4 w-4" /> Edytuj (właściciel)
                  </Button>
                  <Button variant="outline" size="sm" onClick={startChangeRequest}>
                    <FileEdit className="mr-1 h-4 w-4" /> Wniosek o zmianę
                  </Button>
                </>
              )}

              {/* Editing mode for PROJEKT or Owner direct edit */}
              {isEditing && !isChangeRequestMode && (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                    <X className="mr-1 h-4 w-4" /> Anuluj
                  </Button>
                  <Button size="sm" onClick={saveItems} disabled={isSaving}>
                    <Save className="mr-1 h-4 w-4" /> {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                  </Button>
                </>
              )}

              {/* Change request mode */}
              {isEditing && isChangeRequestMode && (
                <>
                  <Button variant="outline" size="sm" onClick={cancelChangeRequest} disabled={isSaving}>
                    <X className="mr-1 h-4 w-4" /> Anuluj
                  </Button>
                  <Button size="sm" onClick={prepareChangeRequest} disabled={isSaving}>
                    <FileEdit className="mr-1 h-4 w-4" /> Złóż wniosek
                  </Button>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isEditing ? (
            <EditableItemsTable
              items={editingItems}
              journals={journals}
              selectedJournalId={selectedJournalId}
              onJournalChange={handleJournalChange}
              classifications={classifications}
              usedClassificationIds={usedClassificationIds}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddItem={addNewItem}
            />
          ) : (
            <ItemsTable items={items} formatAmount={formatAmount} getClassificationLabel={getClassificationLabel} />
          )}

          {/* Change Requests Section - only for approved plans */}
          {plan.status === 'ZATWIERDZONY' && changeRequests.length > 0 && !isEditing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Wnioski o zmianę ({changeRequests.length})</h3>
                <div className="space-y-2">
                  {changeRequests.map((req: any) => (
                    <div key={req.id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{req.requestNumber}</span>
                          <Badge variant={
                            req.status === 'APPROVED' ? 'default' :
                            req.status === 'REJECTED' ? 'destructive' :
                            req.status === 'SUBMITTED' ? 'secondary' :
                            'outline'
                          }>
                            {req.status === 'DRAFT' && 'Szkic'}
                            {req.status === 'SUBMITTED' && 'Złożony'}
                            {req.status === 'IN_REVIEW' && 'W rozpatrywaniu'}
                            {req.status === 'APPROVED' && 'Zatwierdzony'}
                            {req.status === 'REJECTED' && 'Odrzucony'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {/* DRAFT: Edit, Delete, Submit */}
                          {req.status === 'DRAFT' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => editChangeRequest(req)}>
                                <Edit2 className="mr-1 h-4 w-4" /> Edytuj
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteChangeRequest(req.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => submitChangeRequestFn(req.id)}>
                                <FileEdit className="mr-1 h-4 w-4" /> Złóż
                              </Button>
                            </>
                          )}
                          {/* SUBMITTED/IN_REVIEW: Approve only */}
                          {(req.status === 'SUBMITTED' || req.status === 'IN_REVIEW') && (
                            <Button size="sm" onClick={() => approveChangeRequestFn(req.id)}>
                              <CheckCircle className="mr-1 h-4 w-4" /> Zatwierdź
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{req.reason}</p>
                      {req.details && req.details.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Zmiany: </span>
                          {req.details.map((d: any, i: number) => (
                            <span key={d.id}>
                              {i > 0 && ', '}
                              {d.classification?.dzial}.{d.classification?.rozdzial}.{d.classification?.paragraf}
                              {' '}({formatAmount(d.currentAmount)} → {formatAmount(d.requestedAmount)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>

      {/* Change Request Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uzasadnienie wniosku o zmianę</DialogTitle>
            <DialogDescription>
              Podaj uzasadnienie dla wnioskowanych zmian w planie finansowym.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={changeRequestReason}
              onChange={(e) => setChangeRequestReason(e.target.value)}
              placeholder="Wprowadź uzasadnienie zmiany planu..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonDialog(false)} disabled={isSaving}>
              Anuluj
            </Button>
            <Button onClick={submitChangeRequest} disabled={isSaving || !changeRequestReason.trim()}>
              {isSaving ? 'Składanie wniosku...' : 'Złóż wniosek'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

// Single section table (income or expense)
function SectionTable({
  title,
  items,
  formatAmount,
  getClassificationLabel,
  variant,
}: {
  title: string
  items: PlanItem[]
  formatAmount: (amount: string | number) => string
  getClassificationLabel: (item: PlanItem) => string
  variant: 'income' | 'expense'
}) {
  // Sort items by classification
  const sortedItems = [...items].sort((a, b) => {
    const clsA = `${a.classification.dzial}.${a.classification.rozdzial}.${a.classification.paragraf}`
    const clsB = `${b.classification.dzial}.${b.classification.rozdzial}.${b.classification.paragraf}`
    return clsA.localeCompare(clsB)
  })

  // Calculate totals
  const totalPlanned = sortedItems.reduce((sum, i) => sum + parseFloat(String(i.plannedAmount)), 0)
  const totalCurrent = sortedItems.reduce((sum, i) => sum + parseFloat(String(i.currentAmount)), 0)
  const totalExecuted = sortedItems.reduce((sum, i) => sum + parseFloat(String(i.executedAmount)), 0)
  const totalPercent = totalCurrent > 0 ? ((totalExecuted / totalCurrent) * 100).toFixed(1) : '0.0'

  const headerBg = variant === 'income' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-blue-50 dark:bg-blue-950/30'
  const headerText = variant === 'income' ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
  const footerBg = variant === 'income' ? 'bg-green-100/50 dark:bg-green-950/50' : 'bg-blue-100/50 dark:bg-blue-950/50'

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Section header */}
      <div className={`px-4 py-2.5 ${headerBg} border-b`}>
        <h4 className={`font-semibold ${headerText}`}>{title} ({sortedItems.length})</h4>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Klasyfikacja</TableHead>
            <TableHead>Nazwa</TableHead>
            <TableHead className="text-right w-[120px]">Plan</TableHead>
            <TableHead className="text-right w-[120px]">Po zmianach</TableHead>
            <TableHead className="text-right w-[120px]">Wykonanie</TableHead>
            <TableHead className="text-right w-[70px]">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                Brak pozycji
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item) => {
              const planned = parseFloat(String(item.plannedAmount))
              const current = parseFloat(String(item.currentAmount))
              const executed = parseFloat(String(item.executedAmount))
              const percent = current > 0 ? ((executed / current) * 100).toFixed(1) : '0.0'

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm py-2">{getClassificationLabel(item)}</TableCell>
                  <TableCell className="max-w-[250px] truncate py-2" title={item.classification.name}>
                    {item.classification.name}
                  </TableCell>
                  <TableCell className="text-right font-mono py-2">{formatAmount(planned)}</TableCell>
                  <TableCell className="text-right font-mono py-2">{formatAmount(current)}</TableCell>
                  <TableCell className="text-right font-mono py-2">{formatAmount(executed)}</TableCell>
                  <TableCell className="text-right font-mono py-2">{percent}%</TableCell>
                </TableRow>
              )
            })
          )}
          {/* Summary row */}
          {sortedItems.length > 0 && (
            <TableRow className={`${footerBg} font-semibold hover:${footerBg}`}>
              <TableCell className="py-2.5" colSpan={2}>Razem</TableCell>
              <TableCell className="text-right font-mono py-2.5">{formatAmount(totalPlanned)}</TableCell>
              <TableCell className="text-right font-mono py-2.5">{formatAmount(totalCurrent)}</TableCell>
              <TableCell className="text-right font-mono py-2.5">{formatAmount(totalExecuted)}</TableCell>
              <TableCell className="text-right font-mono py-2.5">{totalPercent}%</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Read-only items table with income/expense sections
function ItemsTable({
  items,
  formatAmount,
  getClassificationLabel
}: {
  items: PlanItem[]
  formatAmount: (amount: string | number) => string
  getClassificationLabel: (item: PlanItem) => string
}) {
  const incomeItems = items.filter(i => i.classification.type === 'DOCHOD')
  const expenseItems = items.filter(i => i.classification.type === 'WYDATEK')

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Brak pozycji w planie. Kliknij "Edytuj pozycje" aby dodać.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Income section */}
      <SectionTable
        title="Plan dochodów"
        items={incomeItems}
        formatAmount={formatAmount}
        getClassificationLabel={getClassificationLabel}
        variant="income"
      />

      {/* Expense section */}
      <SectionTable
        title="Plan wydatków"
        items={expenseItems}
        formatAmount={formatAmount}
        getClassificationLabel={getClassificationLabel}
        variant="expense"
      />
    </div>
  )
}

// Editable items table
function EditableItemsTable({
  items,
  journals,
  selectedJournalId,
  onJournalChange,
  classifications,
  usedClassificationIds,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: {
  items: EditingItem[]
  journals: Journal[]
  selectedJournalId: string
  onJournalChange: (id: string) => void
  classifications: BudgetClassification[]
  usedClassificationIds: Set<string>
  onUpdateItem: (index: number, field: 'classificationId' | 'plannedAmount', value: string) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Journal selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dziennik (dla nowych klasyfikacji)</label>
        <Select value={selectedJournalId} onValueChange={onJournalChange}>
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
      </div>

      {/* Group classifications by type */}
      {(() => {
        const incomeClassifications = classifications.filter(c => c.type === 'DOCHOD').sort((a, b) =>
          `${a.dzial}.${a.rozdzial}.${a.paragraf}`.localeCompare(`${b.dzial}.${b.rozdzial}.${b.paragraf}`)
        )
        const expenseClassifications = classifications.filter(c => c.type === 'WYDATEK').sort((a, b) =>
          `${a.dzial}.${a.rozdzial}.${a.paragraf}`.localeCompare(`${b.dzial}.${b.rozdzial}.${b.paragraf}`)
        )

        return (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[350px]">Klasyfikacja</TableHead>
                  <TableHead className="w-[140px]">Kwota planowana</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-1.5">
                      <Select
                        value={item.classificationId}
                        onValueChange={(v) => onUpdateItem(index, 'classificationId', v)}
                        disabled={!selectedJournalId && item.isNew}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Wybierz klasyfikację" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {incomeClassifications.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                                Dochody
                              </div>
                              {incomeClassifications.map((cls) => (
                                <SelectItem
                                  key={cls.id}
                                  value={cls.id}
                                  disabled={usedClassificationIds.has(cls.id) && item.classificationId !== cls.id}
                                  className="pl-4"
                                >
                                  <span className="font-mono text-xs">{cls.dzial}.{cls.rozdzial}.{cls.paragraf}</span>
                                  <span className="mx-2">-</span>
                                  <span className="truncate">{cls.name}</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {expenseClassifications.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 mt-1">
                                Wydatki
                              </div>
                              {expenseClassifications.map((cls) => (
                                <SelectItem
                                  key={cls.id}
                                  value={cls.id}
                                  disabled={usedClassificationIds.has(cls.id) && item.classificationId !== cls.id}
                                  className="pl-4"
                                >
                                  <span className="font-mono text-xs">{cls.dzial}.{cls.rozdzial}.{cls.paragraf}</span>
                                  <span className="mx-2">-</span>
                                  <span className="truncate">{cls.name}</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.plannedAmount}
                        onChange={(e) => onUpdateItem(index, 'plannedAmount', e.target.value)}
                        placeholder="0.00"
                        className="h-9 font-mono"
                      />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Brak pozycji. Wybierz dziennik i kliknij "Dodaj pozycję".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )
      })()}

      <Button
        type="button"
        variant="outline"
        onClick={onAddItem}
        disabled={!selectedJournalId}
        className="w-full"
      >
        <Plus className="mr-1 h-4 w-4" /> Dodaj pozycję
      </Button>
    </div>
  )
}
