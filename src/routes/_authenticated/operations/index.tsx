import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import Operations from '@/features/operations'

const operationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Status filter
  status: z
    .array(
      z.union([
        z.literal('WPROWADZONE'),
        z.literal('ZADEKRETOWANE'),
        z.literal('ZAKSIEGOWANE'),
        z.literal('ANULOWANE'),
      ])
    )
    .optional()
    .catch([]),
  // Per-column text filter
  description: z.string().optional().catch(''),
  documentNumber: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/operations/')({
  validateSearch: operationsSearchSchema,
  component: Operations,
})

