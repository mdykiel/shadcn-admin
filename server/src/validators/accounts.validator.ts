import { z } from 'zod';

export const createAccountSchema = z.object({
  unitId: z.string().min(1, 'ID jednostki jest wymagane'),
  journalId: z.string().min(1, 'ID dziennika jest wymagane'),
  fiscalPeriodId: z.string().optional(),
  number: z.string().min(1, 'Numer konta jest wymagany'),
  name: z.string().min(2, 'Nazwa musi mieć min. 2 znaki'),
  zespol: z.number().min(0).max(8),
  syntetyczne: z.string().min(1, 'Konto syntetyczne jest wymagane'),
  analitpierwsze: z.string().optional(),
  analitdrugie: z.string().optional(),
  accountType: z.enum([
    'BILANSOWE_AKTYWNE',
    'BILANSOWE_PASYWNE',
    'BILANSOWE_AKTYWNO_PASYWNE',
    'WYNIKOWE_KOSZTOWE',
    'WYNIKOWE_PRZYCHODOWE',
    'POZABILANSOWE',
    'ROZLICZENIOWE',
  ]),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.omit({ unitId: true }).partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

