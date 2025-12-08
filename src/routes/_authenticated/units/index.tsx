import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { BudgetUnits } from '@/features/budget-units'

const budgetUnitsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  unitType: z
    .array(
      z.union([
        z.literal('JEDNOSTKA_BUDZETOWA'),
        z.literal('ZAKLAD_BUDZETOWY'),
        z.literal('ORGAN_BUDZETU'),
      ])
    )
    .optional()
    .catch([]),
  // Per-column text filter (example for name)
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/units/')({
  validateSearch: budgetUnitsSearchSchema,
  component: BudgetUnits,
})