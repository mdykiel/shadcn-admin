import { z } from 'zod';

export const createJournalSchema = z.object({
  unitId: z.string().min(1, 'ID jednostki jest wymagane'),
  name: z.string().min(2, 'Nazwa musi mieć min. 2 znaki'),
  shortName: z.string().min(1, 'Skrót jest wymagany').max(10, 'Skrót może mieć max. 10 znaków'),
  type: z.enum(['BUDZET', 'WRD', 'ZFSS', 'INNY']).default('INNY'),
  description: z.string().optional(),
  requiresClassification: z.boolean().default(true),
  hasOwnAccountPlan: z.boolean().default(true),
  hasFinancialPlan: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const updateJournalSchema = createJournalSchema.omit({ unitId: true }).partial();

export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;

