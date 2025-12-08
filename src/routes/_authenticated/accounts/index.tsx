import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ChartOfAccounts } from '@/features/accounts'

const accountsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  accountType: z
    .array(
      z.union([
        z.literal('BILANSOWE_AKTYWNE'),
        z.literal('BILANSOWE_PASYWNE'),
        z.literal('BILANSOWE_AKTYWNO_PASYWNE'),
        z.literal('WYNIKOWE_KOSZTOWE'),
        z.literal('WYNIKOWE_PRZYCHODOWE'),
        z.literal('POZABILANSOWE'),
        z.literal('ROZLICZENIOWE'),
      ])
    )
    .optional()
    .catch([]),
  zespol: z
    .array(z.number())
    .optional()
    .catch([]),
  // Per-column text filter (example for name)
  name: z.string().optional().catch(''),
  number: z.string().optional().catch(''),
  // View mode
  view: z.enum(['list', 'tree']).optional().catch('list'),
})

export const Route = createFileRoute('/_authenticated/accounts/')({
  validateSearch: accountsSearchSchema,
  component: ChartOfAccounts,
})