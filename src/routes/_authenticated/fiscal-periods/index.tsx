import { createFileRoute } from '@tanstack/react-router'
import { FiscalPeriods } from '@/features/fiscal-periods'

export const Route = createFileRoute('/_authenticated/fiscal-periods/')({
  component: FiscalPeriods,
})

