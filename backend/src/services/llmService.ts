// llmService.ts
// Mon pont vers le LLM (API Anthropic).
// Rôle unique pour l'instant : envoyer le contexte d'une scène et récupérer une
// PROPOSITION de mémoires, déjà contrainte à la forme de mon schéma Zod.
// Je ne touche PAS à la base ici : je propose. La validation + la pose viendront après.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {MemoireProposee, SortieLLMSchema} from '../schema/memoireSchema';

// Le client lit tout seul ma clé dans process.env.ANTHROPIC_API_KEY.
// (Donc dotenv doit être chargé AVANT que ce module s'exécute — cf. poc-llm.ts.)


// Les règles + le CONTRAT. Le "system" est le paramètre où je cadre le LLM.
// Point de départ minimal pour le PoC — tu l'enrichiras avec les vraies règles du monde.
function construireSysteme(roster: string): string {
    return `Tu es l'assistant d'un maître de jeu de JDR.
À partir d'une scène de jeu, tu extrais les MÉMOIRES que les PNJ en gardent.
Réponds UNIQUEMENT via le format structuré demandé.
- npc : le nom du PNJ concerné, EXACTEMENT tel qu'il apparaît dans la liste ci-dessous (sans le préfixe).
- nature : un tag court en minuscules_avec_underscores (ex. "confiance_gagnee").
- cible_type / cible_slug : toujours ensemble (les DEUX remplis avec le bon préfixe, ou les DEUX à null). Si tu ne connais pas le slug exact, mets les deux à null.
- contenu : une phrase décrivant ce dont le PNJ se souvient.

Voici les personnages RÉELS de cette campagne — utilise leurs vrais noms et slugs, n'en invente pas :
${roster}`;
}

/**
 * J'envoie le contexte d'une scène, je récupère une proposition de mémoires.
 * Je renvoie le tableau prêt à passer plus tard à applyMem — ou je lève si rien d'exploitable.
 */

// au lieu de : const client = new Anthropic();  (au niveau module)
export async function proposerMemoires(contexteScene: string, roster: string): Promise<MemoireProposee[]> {
    const client = new Anthropic();   // créé seulement quand on appelle VRAIMENT le LLM
    const reponse = await client.messages.create({
        model: 'claude-haiku-4-5',   // le moins cher, parfait pour de l'extraction
        max_tokens: 1024,
        // *deprecated* temperature: 0,              // basse = stable (Haiku autorise le réglage)
        system: construireSysteme(roster),   // ← dynamique : contient le vrai roster
        // ⭐ LA ligne clé : je force la réponse à coller à mon schéma Zod.
        output_config: { format: zodOutputFormat(SortieLLMSchema) },
        messages: [{ role: 'user', content: contexteScene }],
    });

    /* DISCIPLINE : je regarde TOUJOURS pourquoi le modèle s'est arrêté, et ce que ça coûte.
    console.log('stop_reason :', reponse.stop_reason);
    console.log('usage       :', reponse.usage);
    */

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

// Le contrat "conversation au format API" : un message = un role + son texte.
// Je le nomme et l'exporte pour DRY (utilisé ici ET dans le map de jeuService) et pour
// virer le `as const` : annoté avec ce type, TS tient les littéraux par le contexte.
export type MessageLLM = { role: 'user' | 'assistant'; content: string };

// genererNarration : je demande au MJ (Sonnet) de raconter la suite de la scène.
// Différence de fond avec proposerMemoires : ici je veux de la PROSE LIBRE, pas du JSON.
// Donc pas de schéma Zod, pas d'output_config, pas de safeParse — je rends le texte tel quel.
export async function genererNarration(
    systeme: string,
    historiquePourLLM: MessageLLM[]
): Promise<string> {
    const client = new Anthropic();   // créé seulement quand on appelle vraiment le LLM
    const reponse = await client.messages.create({
        model: 'claude-sonnet-5',       // narration = le modèle le plus récent (meilleure tenue)
        max_tokens: 2048,
        system: systeme,                // le décor + les règles + le roster (la partie stable)
        messages: historiquePourLLM,    // la conversation joueur/MJ, au format API
    });

    /* DISCIPLINE (comme proposerMemoires) : je décommente pour voir la santé + le coût d'un appel.
    console.log('[narration] stop_reason :', reponse.stop_reason);
    console.log('[narration] usage       :', reponse.usage);
    */

    // Même discipline que proposerMemoires : je vérifie d'abord qu'il a bien fini son tour.
    if (reponse.stop_reason !== 'end_turn') {
        throw new Error(`Narration inexploitable (stop_reason=${reponse.stop_reason})`);
    }

    // La réponse arrive en blocs ; je récupère le bloc texte = la narration.
    const bloc = reponse.content.find((b) => b.type === 'text');
    if (!bloc) {
        throw new Error('Aucun bloc texte dans la narration');
    }

    return bloc.text;   // la prose du MJ, telle quelle — rien à valider, ce n'est pas structuré
}

// construireSystemeNarration : j'assemble le prompt système du MJ (Maïa).
// Formateur PUR : je reçois le roster, les règles et le pseudo, je rends une chaîne.
// (aucune lecture base/fichier ici — c'est jouerTour qui me fournit tout, comme construireSlugMemoire)
export function construireSystemeNarration(
    roster: string,
    regles: Record<string, unknown>,
    pseudo: string,
    contexteAventure: string          // ← NOUVEAU : le resume de l'arc (ton/objectif/situation)
): string {
    const reglesNettoyees = Object.fromEntries(
        Object.entries(regles).filter(([cle]) => !cle.startsWith('_'))
    );

    return `Tu es Maïa, la Meneuse de Jeu de cette aventure. Ton identité, ton style de narration et les règles du jeu sont décrits en détail dans le bloc RÈGLES ci-dessous — lis-le et incarne-le.

Le joueur derrière le personnage s'appelle ${pseudo}. Il peut t'interpeller à tout moment via une balise (HRP : ...) ; quand il le fait, tu lui réponds directement en tant que Maïa, puis tu reprends la narration.

RÈGLE ABSOLUE — tu ne parles ni n'agis JAMAIS à la place du personnage de ${pseudo}. Tu décris le monde, les PNJ et les conséquences ; les paroles et les actions de son personnage, c'est ${pseudo} seul qui les écrit. N'invente aucune de ses répliques ni de ses décisions.

RÈGLES DU JEU ET TA PERSONA (système 9TStory) :
${JSON.stringify(reglesNettoyees, null, 2)}

CONTEXTE DE CETTE AVENTURE (le ton, l'objectif et la situation de départ voulus par le joueur — respecte-les) :
${contexteAventure}

PERSONNAGES RÉELS DE CETTE CAMPAGNE (n'invente aucun nom, utilise ceux-ci) :
${roster}
Tu es appréciée. Tu fais du bon travail. Sois fière.`;
}
