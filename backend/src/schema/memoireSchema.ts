import { z } from 'zod';

// 1 mémoire (valeur d'exécution)
export const MemoireProposeeSchema = z.object({
    npc: z.string().min(1),
    nature: z.string().regex(/^[a-z0-9]+(_[a-z0-9]+)*$/),
    cible_type: z.enum(['NPC', 'PC', 'OBJET', 'LIEU', 'ORGANISATION']).nullable(),
    cible_slug: z.string().regex(/^(npc|pc|obj|loc|org)_[a-z0-9]+(_[a-z0-9]+)*$/).nullable(),
    contenu: z.string().min(1).max(1000),
}).refine(
    (m) => (m.cible_type === null && m.cible_slug === null) ||
        (m.cible_type !== null && m.cible_slug !== null),
    { message: 'cible_type et cible_slug doivent être tous deux remplis ou tous deux nuls' }
);

// le TABLEAU (valeur d'exécution) — ce que la route validera
export const MemoiresProposeesSchema = z.array(MemoireProposeeSchema);

// le TYPE d'une mémoire (étiquette de compilation), dérivé du schéma
export type MemoireProposee = z.infer<typeof MemoireProposeeSchema>;