import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(2, 'Nazwa musi mieć min. 2 znaki'),
  shortName: z.string().optional(),
  regon: z.string().optional(),
  nip: z.string().optional(),
  unitType: z.enum(['JEDNOSTKA_BUDZETOWA', 'ZAKLAD_BUDZETOWY', 'ORGAN_BUDZETU']).default('JEDNOSTKA_BUDZETOWA'),
  defaultDzial: z.string().optional(),
  defaultRozdzial: z.string().optional(),
  fiscalYearStart: z.number().min(1).max(12).default(1),
  createDefaultJournals: z.boolean().default(true),
});

export const updateUnitSchema = createUnitSchema.omit({ createDefaultJournals: true }).partial();

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

