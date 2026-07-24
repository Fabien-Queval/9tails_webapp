import { z } from 'zod';

// Le JET que Maïa PROPOSE — elle ne le lance pas, elle ne le résout pas.
// Elle remplit juste "de quoi il s'agit" ; c'est le front (modale) qui lancera les dés via POST /api/roll.
export const JetProposeSchema = z.object({
    // La caractéristique testée — EXACTEMENT les 4 de la fiche perso / du système 9TStory.
    caracteristique: z.enum(['CORPS', 'SENS', 'ESPRIT', 'SOCIAL']),
    // Le seuil de difficulté fixé par Maïa (entier positif).
    difficulte: z.number().int().min(1),
    // Pourquoi ce jet — une phrase courte que la modale affichera au joueur.
    raison: z.string().min(1),
});

// La SORTIE de Maïa à chaque tour : toujours un récit, et un jet SEULEMENT quand il en faut un.
// jet_propose = null la plupart du temps (aucun jet requis) ; c'est ce null que le front teste
// pour décider d'ouvrir la modale ou pas.
// NB : c'est déjà un OBJET à la racine → passable direct à zodOutputFormat, pas besoin d'enveloppe
// comme SortieLLMSchema (qui devait emballer un TABLEAU).
export const NarrationSchema = z.object({
    recit: z.string().min(1),
    jet_propose: JetProposeSchema.nullable(),
});

// Les TYPES (étiquettes de compilation), dérivés des schémas.
export type JetPropose = z.infer<typeof JetProposeSchema>;
export type Narration = z.infer<typeof NarrationSchema>;
