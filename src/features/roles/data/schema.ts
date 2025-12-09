import { z } from 'zod'

export const permissionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  module: z.string(),
})

export type Permission = z.infer<typeof permissionSchema>

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  unitId: z.string(),
  permissions: z.array(permissionSchema).optional(),
  _count: z.object({
    users: z.number(),
  }).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Role = z.infer<typeof roleSchema>

