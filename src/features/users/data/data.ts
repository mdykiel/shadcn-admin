import { type UserStatus } from './schema'

export const statusStyles = new Map<UserStatus, string>([
  ['ACTIVE', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['INACTIVE', 'bg-neutral-300/40 border-neutral-300'],
  ['INVITED', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  [
    'SUSPENDED',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
])

export const statusOptions = [
  { label: 'Aktywny', value: 'ACTIVE' },
  { label: 'Nieaktywny', value: 'INACTIVE' },
  { label: 'Zaproszony', value: 'INVITED' },
  { label: 'Zawieszony', value: 'SUSPENDED' },
] as const
