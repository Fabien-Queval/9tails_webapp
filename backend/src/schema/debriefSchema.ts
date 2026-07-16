import { z } from 'zod';
import { MemoireProposeeSchema } from './memoireSchema';

// Un PNJ que Maïa a fait naître pendant la scène et juge important pour la suite.
// Je ne lui demande PAS de slug : le backend le fabrique (slugNpc). Le LLM reste suspect.
const NouveauPersonnageSchema = z.object({
    nom:         z.string().min(1),
    description: z.string().min(1),
});

// La sortie complète du débrief.
export const DebriefSchema = z.object({
    titre:                z.string().min(1),   // le nom du CP
    resume:               z.string().min(1),   // UNE ligne — tooltip Codex
    contenu:              z.string().min(1),   // synthèse détaillée — ce que le snapshot assemble
    nouveaux_personnages: z.array(NouveauPersonnageSchema),
    souvenirs:            z.array(MemoireProposeeSchema),
});

export type Debrief = z.infer<typeof DebriefSchema>;
export type NouveauPersonnage = z.infer<typeof NouveauPersonnageSchema>;
