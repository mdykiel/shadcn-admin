import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('ACTIVE'),
  z.literal('INACTIVE'),
  z.literal('INVITED'),
  z.literal('SUSPENDED'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  isSystem: z.boolean(),
  isActive: z.boolean(),
})
export type Role = z.infer<typeof roleSchema>

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: userStatusSchema,
  isSystemAdmin: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  unitRole: z.string().optional().nullable(),
  isOwner: z.boolean().optional(),
  roles: z.array(roleSchema).optional(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

// Status labels for display
export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Aktywny',
  INACTIVE: 'Nieaktywny',
  INVITED: 'Zaproszony',
  SUSPENDED: 'Zawieszony',
}

// Status colors for badges
export const userStatusColors: Record<UserStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  INVITED: 'outline',
  SUSPENDED: 'destructive',
}
