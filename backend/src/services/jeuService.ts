import { enregistrerMessage, lireFilRecent } from "./messageService";
import { genererNarration, construireSystemeNarration, MessageLLM } from "./llmService";
import { serialiserRoster } from "./memoireService";
import { chargerRegles } from "../data/reglesLoader";
import { getPersonnageByCampagneDal } from "../dal/personnageDal";
import { getNpcsByCampagneDal } from "../dal/npcDAL";
import { getUserById } from "../dal/userDAL";
import {getArcsByCampagneDal} from "../dal/arcDAL";
import { Narration } from "../schema/narrationSchema";
import { FichePcSchema } from "../schema/ficheSchema";
import { roll, RollResult } from "./rollService";
import { assertProprietaireCampagne } from "./campagneService";

// ┌──────────────────────────────────────────────────────────────────┐
// │  LEVIER DE RÉGLAGE — taille de la fenêtre glissante.              │
// │  Combien des derniers messages je renvoie au MJ à chaque tour.   │
// │  Un seul endroit à toucher pendant les tests de charge.          │
// └──────────────────────────────────────────────────────────────────┘
const NB_MESSAGES_FENETRE = 20;

// jouerTour : j'enchaîne un tour de jeu complet (action du joueur -> narration du MJ).
export async function jouerTour(
    id_utilisateur: number,
    id_campagne: number,
    actionJoueur: string
): Promise<Narration> {
    // 1. Je grave l'action du joueur.
    //    La garde IDOR est ICI : enregistrerMessage appelle assertProprietaireCampagne en
    //    PREMIER -> un intrus est rejeté avant tout, donc avant l'appel payant au LLM.
    //    Bonus : cette action entrera dans la fenêtre que je lis juste après.
    enregistrerMessage(id_utilisateur, id_campagne, 'JOUEUR', actionJoueur);

    // 2. Je lis la fenêtre récente (elle contient DÉJÀ l'action qu'on vient de graver).
    const fil = lireFilRecent(id_utilisateur, id_campagne, NB_MESSAGES_FENETRE);

    // 3. Je transforme mes lignes MESSAGE en conversation au format API.
    //    Annoté MessageLLM[] -> TS tient les littéraux par le contexte, pas besoin de `as const`.
    const historiquePourLLM: MessageLLM[] = fil.map((m) => ({
        role: m.emetteur === 'JOUEUR' ? 'user' : 'assistant',
        content: m.contenu,
    }));

    // 4. J'assemble le SYSTEME (la partie STABLE) : roster + règles + pseudo.
    const pc = getPersonnageByCampagneDal(id_campagne);
    const npcsActifs = getNpcsByCampagneDal(id_campagne, 'ACTIF');
    const roster = serialiserRoster(pc, npcsActifs);
    const regles = chargerRegles();
    const utilisateur = getUserById(id_utilisateur);
    const pseudo = utilisateur?.pseudo ?? 'le joueur';   // repli défensif si l'user a disparu
    // Je récupère l'arc EN_COURS pour injecter son contexte (ton/objectif/situation) dans le prompt.
    const arcsEnCours   = getArcsByCampagneDal(id_campagne, 'EN_COURS');
    const arcCourant = arcsEnCours[arcsEnCours.length - 1];   // l'acte actif (le plus récent)
    const contexteAventure = arcCourant?.resume ?? '';     // repli si la campagne n'a pas encore d'arc
    const systeme = construireSystemeNarration(roster, regles, pseudo, contexteAventure);

    // 5. Le MJ raconte (le SEUL appel payant du tour). Il me rend { recit, jet_propose }.
    const reponseMaia = await genererNarration(systeme, historiquePourLLM);

    // 6. Je grave la PROSE du MJ dans le fil (le jet n'est PAS un message : c'est un signal pour le front).
    enregistrerMessage(id_utilisateur, id_campagne, 'MJ', reponseMaia.recit);

    // 7. Je renvoie l'objet complet : le front affichera le recit et ouvrira la modale si jet_propose existe.
    return reponseMaia;
}

// lancerJet : je résous un jet pour le perso de la campagne.
// Le pool (nb de dés) NE vient PAS du LLM ni du front : je le calcule ICI depuis la fiche.
export function lancerJet(
    id_utilisateur: number,
    id_campagne: number,
    caracteristique: 'CORPS' | 'SENS' | 'ESPRIT' | 'SOCIAL',
    difficulte: number
): RollResult & { pool: number; rang: number } {
    assertProprietaireCampagne(id_campagne, id_utilisateur);   // garde IDOR avant tout

    const pc = getPersonnageByCampagneDal(id_campagne);
    if (!pc) throw new Error('Personnage introuvable');

    // fiche_json est stockée en TEXTE (string JSON) → je la parse puis je la valide avec mon schéma Zod.
    const fiche = FichePcSchema.parse(JSON.parse(pc.fiche_json));

    // La carac du jet est en MAJUSCULES ('CORPS'), la fiche la range en minuscules ('corps') → je mets la clé au bon casse.
    const cle = caracteristique.toLowerCase() as keyof typeof fiche.caracteristiques;
    const rang = fiche.caracteristiques[cle];

    // TA formule : pool = valeur de la carac + 2. (le rang_aventure ne sert PAS ici)
    const pool = rang + 2;

    // Je lance le dé (rollService, inchangé) et je renvoie AUSSI pool + rang pour l'affichage.
    const resultat = roll(`Jet ${caracteristique}`, pool, difficulte);
    return { ...resultat, pool, rang };
}
