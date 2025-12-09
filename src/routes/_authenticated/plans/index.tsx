import { createFileRoute } from '@tanstack/react-router'
import { FinancialPlans } from '@/features/plans'

export const Route = createFileRoute('/_authenticated/plans/')({
  component: FinancialPlans,
})

