import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { BudgetClassification } from '@/features/budget-classification'

const searchSchema = z.object({
  type: z.enum(['DOCHOD', 'WYDATEK', 'PRZYCHOD', 'ROZCHOD']).optional(),
  dzial: z.string().optional(),
  rozdzial: z.string().optional(),
  podparagraf: z.string().optional(),
  name: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
  view: z.enum(['list', 'tree']).default('list'),
})

export const Route = createFileRoute('/_authenticated/classification/')({
  validateSearch: searchSchema,
  component: BudgetClassificationPage,
})

function BudgetClassificationPage() {
  const search = Route.useSearch()

  return (
    <BudgetClassification
      search={search}
      navigate={Route.useNavigate()}
    />
  )
}