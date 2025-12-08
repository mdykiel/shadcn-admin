import { z } from 'zod';

export const createClassificationSchema = z.object({
  unitId: z.string().min(1, 'ID jednostki jest wymagane'),
  journalId: z.string().min(1, 'ID dziennika jest wymagane').optional().nullable(),
  dzial: z.string().length(3, 'Dział musi mieć 3 cyfry'),
  rozdzial: z.string().length(5, 'Rozdział musi mieć 5 cyfr'),
  paragraf: z.string().length(4, 'Paragraf musi mieć 4 cyfry'),
  podparagraf: z.string().max(2, 'Podparagraf może mieć max. 2 cyfry').optional().nullable(),
  name: z.string().min(2, 'Nazwa musi mieć min. 2 znaki'),
  type: z.enum(['DOCHOD', 'WYDATEK', 'PRZYCHOD', 'ROZCHOD']),
});

export const updateClassificationSchema = createClassificationSchema.omit({ unitId: true }).partial();

export type CreateClassificationInput = z.infer<typeof createClassificationSchema>;
export type UpdateClassificationInput = z.infer<typeof updateClassificationSchema>;

