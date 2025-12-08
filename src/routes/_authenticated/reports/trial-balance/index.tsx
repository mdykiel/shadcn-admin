import { createFileRoute } from '@tanstack/react-router'
import { TrialBalance } from '@/features/trial-balance'

export const Route = createFileRoute('/_authenticated/reports/trial-balance/')({
  component: TrialBalance,
})

