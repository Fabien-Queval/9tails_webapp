import { z } from 'zod';

export const FichePcSchema = z.object({
    version_fiche_pc: z.literal('1.0.0'),
    rang_aventure: z.int().min(1).max(7),

    caracteristiques: z.object({
        corps: z.int().min(0).max(7),
        sens: z.int().min(0).max(7),
        esprit: z.int().min(0).max(7),
        social: z.int().min(0).max(7),
    }),

    competences: z.record(
        z.string(),
        z.int().min(1).max(7)
        ).optional(),
});

export type FichePersonnage = z.infer<typeof FichePcSchema>;