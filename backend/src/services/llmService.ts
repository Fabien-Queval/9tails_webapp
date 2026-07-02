// llmService.ts
// Mon pont vers le LLM (API Anthropic).
// Rôle unique pour l'instant : envoyer le contexte d'une scène et récupérer une
// PROPOSITION de mémoires, déjà contrainte à la forme de mon schéma Zod.
// Je ne touche PAS à la base ici : je propose. La validation + la pose viendront après.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { SortieLLMSchema, MemoireProposee } from '../schema/memoireSchema';

// Le client lit tout seul ma clé dans process.env.ANTHROPIC_API_KEY.
// (Donc dotenv doit être chargé AVANT que ce module s'exécute — cf. poc-llm.ts.)
const client = new Anthropic();

// Les règles + le CONTRAT. Le "system" est le paramètre où je cadre le LLM.
// Point de départ minimal pour le PoC — tu l'enrichiras avec les vraies règles du monde.
const SYSTEME = `Tu es l'assistant d'un maître de jeu de JDR.
À partir d'une scène de jeu, tu extrais les MÉMOIRES que les PNJ en gardent.
Réponds UNIQUEMENT via le format structuré demandé.
- npc : le slug du PNJ concerné, NU (ex. "rosalita"), sans préfixe "npc_".
- nature : un tag court en minuscules_avec_underscores (ex. "confiance_gagnee").
- cible_type / cible_slug : cible_type et cible_slug vont toujours ensemble : soit les DEUX remplis (avec le bon préfixe), soit les DEUX à null. Si tu ne connais pas le slug exact de la cible, mets les deux à null..
- contenu : une phrase décrivant ce dont le PNJ se souvient.
- considère que le PC a pour slug pc_fabien`;

/**
 * J'envoie le contexte d'une scène, je récupère une proposition de mémoires.
 * Je renvoie le tableau prêt à passer plus tard à applyMem — ou je lève si rien d'exploitable.
 */
export async function proposerMemoires(contexteScene: string): Promise<MemoireProposee[]> {
    const reponse = await client.messages.create({
        model: 'claude-haiku-4-5',   // le moins cher, parfait pour de l'extraction
        max_tokens: 1024,
        // *deprecated* temperature: 0,              // basse = stable (Haiku autorise le réglage)
        system: SYSTEME,
        // ⭐ LA ligne clé : je force la réponse à coller à mon schéma Zod.
        output_config: { format: zodOutputFormat(SortieLLMSchema) },
        messages: [{ role: 'user', content: contexteScene }],
    });

    // DISCIPLINE : je regarde TOUJOURS pourquoi le modèle s'est arrêté, et ce que ça coûte.
    console.log('stop_reason :', reponse.stop_reason);
    console.log('usage       :', reponse.usage);

    // end_turn = réponse complète. Tout le reste (max_tokens, refusal…) = pas exploitable tel quel.
    if (reponse.stop_reason !== 'end_turn') {
        throw new Error(`Réponse inexploitable (stop_reason=${reponse.stop_reason})`);
    }

    // La réponse arrive en BLOCS. Je récupère le bloc texte (le JSON est dedans).
    const bloc = reponse.content.find((b) => b.type === 'text');
    if (!bloc) {
        throw new Error('Aucun bloc texte dans la réponse');
    }

    // Le LLM reste SUSPECT : même contraint, je re-valide avec MON schéma (mon réflexe habituel).
    // console.log('RAW LLM →', bloc.text);   // ce que le LLM a VRAIMENT renvoyé
    const parsed = SortieLLMSchema.safeParse(JSON.parse(bloc.text));
    if (!parsed.success) {
        throw new Error('Sortie LLM non conforme : ' + parsed.error.message);
    }

    return parsed.data.vehiculeMemoires;   // le tableau, prêt pour applyMem plus tard
}
