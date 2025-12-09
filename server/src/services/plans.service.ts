import prisma from '../utils/prisma.js'
import { PlanStatus, PlanType, PlanChangeRequestStatus, PlanChangeType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ================== Financial Plans ==================

export async function getPlans(unitId: string, year?: number) {
  const where: any = { unitId }
  if (year) {
    where.year = year
  }
  
  return prisma.financialPlan.findMany({
    where,
    include: {
      items: {
        include: {
          classification: true,
        },
      },
      _count: {
        select: {
          items: true,
          changes: true,
          changeRequests: true,
        },
      },
    },
    orderBy: [
      { year: 'desc' },
      { version: 'desc' },
    ],
  })
}

export async function getPlanById(id: string) {
  return prisma.financialPlan.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          classification: true,
        },
        orderBy: {
          classification: {
            dzial: 'asc',
          },
        },
      },
      changes: {
        include: {
          details: true,
        },
        orderBy: { changeDate: 'desc' },
      },
      changeRequests: {
        orderBy: { requestDate: 'desc' },
      },
      basedOnPlan: true,
    },
  })
}

export async function createPlan(data: {
  unitId: string
  year: number
  planType?: PlanType
  name?: string
  description?: string
  items?: Array<{
    classificationId: string
    plannedAmount: number
  }>
}) {
  // Validate unique classification IDs
  if (data.items && data.items.length > 0) {
    const classificationIds = data.items.map(item => item.classificationId)
    const uniqueIds = new Set(classificationIds)
    if (classificationIds.length !== uniqueIds.size) {
      throw new Error('Każda klasyfikacja może być użyta tylko raz w planie')
    }
  }

  // Get next version for this unit/year
  const existingPlans = await prisma.financialPlan.findMany({
    where: {
      unitId: data.unitId,
      year: data.year,
    },
    orderBy: { version: 'desc' },
    take: 1,
  })

  const nextVersion = existingPlans.length > 0 ? existingPlans[0].version + 1 : 1

  return prisma.financialPlan.create({
    data: {
      unitId: data.unitId,
      year: data.year,
      version: nextVersion,
      planType: data.planType || 'PROJEKT',
      status: 'PROJEKT',
      name: data.name || `Plan finansowy ${data.year} v${nextVersion}`,
      description: data.description,
      items: data.items && data.items.length > 0 ? {
        create: data.items.map(item => ({
          classificationId: item.classificationId,
          plannedAmount: new Decimal(item.plannedAmount),
          currentAmount: new Decimal(item.plannedAmount),
        })),
      } : undefined,
    },
    include: {
      items: {
        include: {
          classification: true,
        },
      },
      _count: {
        select: {
          items: true,
          changes: true,
          changeRequests: true,
        },
      },
    },
  })
}

export async function updatePlan(id: string, data: {
  name?: string
  description?: string
  status?: PlanStatus
  planType?: PlanType
  validFrom?: Date
  validTo?: Date
  approvedBy?: string
  items?: Array<{
    classificationId: string
    plannedAmount: number
  }>
}) {
  // Validate unique classification IDs
  if (data.items && data.items.length > 0) {
    const classificationIds = data.items.map(item => item.classificationId)
    const uniqueIds = new Set(classificationIds)
    if (classificationIds.length !== uniqueIds.size) {
      throw new Error('Każda klasyfikacja może być użyta tylko raz w planie')
    }
  }

  // Use transaction to update plan and items
  return prisma.$transaction(async (tx) => {
    const { items, ...planData } = data
    const updateData: any = { ...planData }

    if (data.status === 'ZATWIERDZONY') {
      updateData.approvedAt = new Date()
    }

    // If items are provided, delete existing and create new ones
    if (items !== undefined) {
      // Delete existing items
      await tx.financialPlanItem.deleteMany({
        where: { planId: id },
      })

      // Create new items
      if (items.length > 0) {
        await tx.financialPlanItem.createMany({
          data: items.map(item => ({
            planId: id,
            classificationId: item.classificationId,
            plannedAmount: new Decimal(item.plannedAmount),
            currentAmount: new Decimal(item.plannedAmount),
          })),
        })
      }
    }

    return tx.financialPlan.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            classification: true,
          },
        },
        _count: {
          select: {
            items: true,
            changes: true,
            changeRequests: true,
          },
        },
      },
    })
  })
}

export async function deletePlan(id: string, userId?: string) {
  const plan = await prisma.financialPlan.findUnique({
    where: { id },
    include: { unit: true }
  })
  if (!plan) {
    throw new Error('Plan nie istnieje')
  }

  // Check if user is owner or system admin - they can delete any plan
  let canForceDelete = false
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.isSystemAdmin) {
      canForceDelete = true
    } else {
      const userUnit = await prisma.userUnit.findUnique({
        where: { userId_unitId: { userId, unitId: plan.unitId } }
      })
      if (userUnit?.isOwner || userUnit?.role === 'OWNER') {
        canForceDelete = true
      }
    }
  }

  // Regular users can only delete draft plans
  if (!canForceDelete && plan.status !== 'PROJEKT') {
    throw new Error('Można usunąć tylko plany w statusie PROJEKT')
  }

  // Delete related data first for non-draft plans
  return prisma.$transaction(async (tx) => {
    // Delete change request details first
    await tx.planChangeRequestDetail.deleteMany({
      where: { changeRequest: { planId: id } }
    })
    // Delete change requests
    await tx.planChangeRequest.deleteMany({ where: { planId: id } })
    // Delete plan change details
    await tx.planChangeDetail.deleteMany({
      where: { planChange: { planId: id } }
    })
    // Delete plan changes
    await tx.planChange.deleteMany({ where: { planId: id } })
    // Delete plan items
    await tx.financialPlanItem.deleteMany({ where: { planId: id } })
    // Finally delete the plan
    return tx.financialPlan.delete({ where: { id } })
  })
}

// Approve a draft plan (PROJEKT -> ZATWIERDZONY)
export async function approvePlan(id: string, approvedBy: string) {
  const plan = await prisma.financialPlan.findUnique({
    where: { id },
    include: { items: true }
  })

  if (!plan) {
    throw new Error('Plan nie istnieje')
  }
  if (plan.status !== 'PROJEKT') {
    throw new Error('Można zatwierdzić tylko plany w statusie PROJEKT')
  }
  if (plan.items.length === 0) {
    throw new Error('Nie można zatwierdzić pustego planu')
  }

  return prisma.$transaction(async (tx) => {
    // Update plan status and set currentAmount = plannedAmount for all items
    const updatedPlan = await tx.financialPlan.update({
      where: { id },
      data: {
        status: 'ZATWIERDZONY',
        planType: 'PLAN_PIERWOTNY',
        approvedAt: new Date(),
        approvedBy,
        validFrom: new Date(),
      },
      include: {
        items: {
          include: { classification: true },
        },
        _count: {
          select: { items: true, changes: true, changeRequests: true },
        },
      },
    })

    // Set currentAmount = plannedAmount for all items
    for (const item of plan.items) {
      await tx.financialPlanItem.update({
        where: { id: item.id },
        data: { currentAmount: item.plannedAmount },
      })
    }

    return updatedPlan
  })
}

// ================== Plan Items ==================

export async function addPlanItem(planId: string, data: {
  classificationId: string
  plannedAmount: number
}) {
  return prisma.financialPlanItem.create({
    data: {
      planId,
      classificationId: data.classificationId,
      plannedAmount: new Decimal(data.plannedAmount),
      currentAmount: new Decimal(data.plannedAmount),
    },
    include: {
      classification: true,
    },
  })
}

export async function updatePlanItem(id: string, data: {
  plannedAmount?: number
  currentAmount?: number
}) {
  const updateData: any = {}
  if (data.plannedAmount !== undefined) {
    updateData.plannedAmount = new Decimal(data.plannedAmount)
  }
  if (data.currentAmount !== undefined) {
    updateData.currentAmount = new Decimal(data.currentAmount)
  }

  return prisma.financialPlanItem.update({
    where: { id },
    data: updateData,
    include: {
      classification: true,
    },
  })
}

export async function deletePlanItem(id: string) {
  return prisma.financialPlanItem.delete({ where: { id } })
}

// ================== Change Requests ==================

export async function getChangeRequests(planId: string) {
  return prisma.planChangeRequest.findMany({
    where: { planId },
    include: {
      details: {
        include: {
          classification: true,
        },
      },
    },
    orderBy: { requestDate: 'desc' },
  })
}

export async function createChangeRequest(planId: string, data: {
  requestNumber: string
  requestedBy?: string
  reason: string
  details: Array<{
    classificationId: string
    currentAmount: number
    requestedAmount: number
  }>
}) {
  return prisma.planChangeRequest.create({
    data: {
      planId,
      requestNumber: data.requestNumber,
      requestedBy: data.requestedBy,
      reason: data.reason,
      status: 'DRAFT',
      details: {
        create: data.details.map(d => ({
          classificationId: d.classificationId,
          currentAmount: new Decimal(d.currentAmount),
          requestedAmount: new Decimal(d.requestedAmount),
          changeAmount: new Decimal(d.requestedAmount - d.currentAmount),
        })),
      },
    },
    include: {
      details: {
        include: {
          classification: true,
        },
      },
    },
  })
}

export async function updateChangeRequestStatus(id: string, data: {
  status: PlanChangeRequestStatus
  approvedBy?: string
  rejectedBy?: string
  rejectionReason?: string
}) {
  const updateData: any = { status: data.status }

  if (data.status === 'APPROVED') {
    updateData.approvedAt = new Date()
    updateData.approvedBy = data.approvedBy
  } else if (data.status === 'REJECTED') {
    updateData.rejectedAt = new Date()
    updateData.rejectedBy = data.rejectedBy
    updateData.rejectionReason = data.rejectionReason
  }

  return prisma.planChangeRequest.update({
    where: { id },
    data: updateData,
    include: {
      details: {
        include: {
          classification: true,
        },
      },
    },
  })
}

// Submit a change request (DRAFT -> SUBMITTED)
export async function submitChangeRequest(id: string) {
  const request = await prisma.planChangeRequest.findUnique({
    where: { id },
  })

  if (!request) {
    throw new Error('Wniosek nie istnieje')
  }

  if (request.status !== 'DRAFT') {
    throw new Error('Można złożyć tylko wnioski w statusie Szkic')
  }

  return prisma.planChangeRequest.update({
    where: { id },
    data: { status: 'SUBMITTED' },
    include: {
      details: {
        include: { classification: true },
      },
    },
  })
}

// Delete a change request
export async function deleteChangeRequest(id: string) {
  // First check if the request can be deleted (not approved)
  const request = await prisma.planChangeRequest.findUnique({
    where: { id },
  })

  if (!request) {
    throw new Error('Wniosek nie istnieje')
  }

  if (request.status === 'APPROVED') {
    throw new Error('Nie można usunąć zatwierdzonego wniosku')
  }

  // Delete details first, then the request
  await prisma.planChangeRequestDetail.deleteMany({
    where: { requestId: id },
  })

  return prisma.planChangeRequest.delete({
    where: { id },
  })
}

// Approve change request and create a new plan version
export async function approveChangeRequest(requestId: string, approvedBy: string) {
  const request = await prisma.planChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      details: {
        include: { classification: true },
      },
      plan: {
        include: {
          items: {
            include: { classification: true },
          },
        },
      },
    },
  })

  if (!request) {
    throw new Error('Wniosek nie istnieje')
  }
  if (request.status !== 'SUBMITTED' && request.status !== 'IN_REVIEW') {
    throw new Error('Można zatwierdzić tylko wnioski w statusie ZŁOŻONY lub W ROZPATRYWANIU')
  }

  const basePlan = request.plan

  return prisma.$transaction(async (tx) => {
    // 1. Update request status to APPROVED
    await tx.planChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy,
      },
    })

    // 2. Get next version number
    const maxVersion = await tx.financialPlan.findFirst({
      where: { unitId: basePlan.unitId, year: basePlan.year },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const newVersion = (maxVersion?.version || 0) + 1

    // 3. Create new plan based on old plan
    const newPlan = await tx.financialPlan.create({
      data: {
        unitId: basePlan.unitId,
        year: basePlan.year,
        version: newVersion,
        planType: 'PLAN_PO_ZMIANACH',
        status: 'ZATWIERDZONY',
        name: `Plan po zmianach v${newVersion}`,
        description: `Utworzony na podstawie wniosku ${request.requestNumber}`,
        validFrom: new Date(),
        approvedAt: new Date(),
        approvedBy,
        basedOnPlanId: basePlan.id,
      },
    })

    // 4. Copy items from old plan and apply changes
    const changesMap = new Map(request.details.map(d => [d.classificationId, d.requestedAmount]))

    for (const item of basePlan.items) {
      const newAmount = changesMap.has(item.classificationId)
        ? changesMap.get(item.classificationId)!
        : item.currentAmount

      await tx.financialPlanItem.create({
        data: {
          planId: newPlan.id,
          classificationId: item.classificationId,
          // plannedAmount = poprzedni currentAmount (stan przed zmianą)
          plannedAmount: item.currentAmount,
          currentAmount: newAmount,
          executedAmount: item.executedAmount,
        },
      })
    }

    // 5. Add new items from request that don't exist in base plan
    const existingClassificationIds = new Set(basePlan.items.map(i => i.classificationId))
    for (const detail of request.details) {
      if (!existingClassificationIds.has(detail.classificationId)) {
        await tx.financialPlanItem.create({
          data: {
            planId: newPlan.id,
            classificationId: detail.classificationId,
            // Dla nowych pozycji: plan = 0, po zmianach = wnioskowana kwota
            plannedAmount: new Decimal(0),
            currentAmount: detail.requestedAmount,
            executedAmount: new Decimal(0),
          },
        })
      }
    }

    // 6. Create PlanChange record linked to request
    const changeNumber = `ZM/${basePlan.year}/${String(newVersion).padStart(3, '0')}`
    await tx.planChange.create({
      data: {
        planId: newPlan.id,
        requestId: request.id,
        changeNumber,
        changeType: 'ZMIANA',
        description: request.reason,
        approvedBy,
        details: {
          create: request.details.map(d => {
            const oldItem = basePlan.items.find(i => i.classificationId === d.classificationId)
            return {
              planItemId: oldItem?.id || '', // We'll need to find the new item
              previousAmount: d.currentAmount,
              newAmount: d.requestedAmount,
              changeAmount: d.requestedAmount.sub(d.currentAmount),
            }
          }).filter(d => d.planItemId), // Only include items that existed
        },
      },
    })

    // 7. Mark old plan as archived
    await tx.financialPlan.update({
      where: { id: basePlan.id },
      data: { status: 'ARCHIWALNY' },
    })

    return tx.financialPlan.findUnique({
      where: { id: newPlan.id },
      include: {
        items: {
          include: { classification: true },
        },
        _count: {
          select: { items: true, changes: true, changeRequests: true },
        },
      },
    })
  })
}

// ================== Plan Changes ==================

export async function getPlanChanges(planId: string) {
  return prisma.planChange.findMany({
    where: { planId },
    include: {
      details: {
        include: {
          planItem: {
            include: {
              classification: true,
            },
          },
        },
      },
      request: true,
    },
    orderBy: { changeDate: 'desc' },
  })
}

export async function applyPlanChange(planId: string, data: {
  changeNumber: string
  changeType?: PlanChangeType
  description?: string
  approvedBy?: string
  legalBasis?: string
  requestId?: string
  details: Array<{
    planItemId: string
    previousAmount: number
    newAmount: number
  }>
}) {
  // Create change record and update plan items in a transaction
  return prisma.$transaction(async (tx) => {
    // Create the change record
    const change = await tx.planChange.create({
      data: {
        planId,
        requestId: data.requestId,
        changeNumber: data.changeNumber,
        changeType: data.changeType || 'ZMIANA',
        description: data.description,
        approvedBy: data.approvedBy,
        legalBasis: data.legalBasis,
        details: {
          create: data.details.map(d => ({
            planItemId: d.planItemId,
            previousAmount: new Decimal(d.previousAmount),
            newAmount: new Decimal(d.newAmount),
            changeAmount: new Decimal(d.newAmount - d.previousAmount),
          })),
        },
      },
      include: {
        details: true,
      },
    })

    // Update plan items with new amounts
    for (const detail of data.details) {
      await tx.financialPlanItem.update({
        where: { id: detail.planItemId },
        data: {
          currentAmount: new Decimal(detail.newAmount),
        },
      })
    }

    return change
  })
}

// ================== Summary/Stats ==================

export async function getPlanSummary(planId: string) {
  const plan = await prisma.financialPlan.findUnique({
    where: { id: planId },
    include: {
      items: {
        include: {
          classification: true,
        },
      },
    },
  })

  if (!plan) return null

  // Group by classification type
  const summary = {
    totalPlanned: new Decimal(0),
    totalCurrent: new Decimal(0),
    totalExecuted: new Decimal(0),
    byType: {} as Record<string, { planned: Decimal; current: Decimal; executed: Decimal }>,
  }

  for (const item of plan.items) {
    const type = item.classification.type
    if (!summary.byType[type]) {
      summary.byType[type] = { planned: new Decimal(0), current: new Decimal(0), executed: new Decimal(0) }
    }
    summary.byType[type].planned = summary.byType[type].planned.add(item.plannedAmount)
    summary.byType[type].current = summary.byType[type].current.add(item.currentAmount)
    summary.byType[type].executed = summary.byType[type].executed.add(item.executedAmount)
    summary.totalPlanned = summary.totalPlanned.add(item.plannedAmount)
    summary.totalCurrent = summary.totalCurrent.add(item.currentAmount)
    summary.totalExecuted = summary.totalExecuted.add(item.executedAmount)
  }

  return {
    plan,
    summary,
  }
}

