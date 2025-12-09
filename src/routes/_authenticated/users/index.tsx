import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  status: z
    .array(
      z.union([
        z.literal('ACTIVE'),
        z.literal('INACTIVE'),
        z.literal('INVITED'),
        z.literal('SUSPENDED'),
      ])
    )
    .optional()
    .catch([]),
  // Per-column text filter
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
