import { enregistrerMessage, lireFilRecent } from "./messageService";
import { genererNarration, construireSystemeNarration, MessageLLM } from "./llmService";
import { serialiserRoster } from "./memoireService";
import { chargerRegles } from "../data/reglesLoader";
import { getPersonnageByCampagneDal } from "../dal/personnageDal";
import { getNpcsByCampagneDal } from "../dal/npcDAL";
import { getUserById } from "../dal/userDAL";

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
): Promise<string> {
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
    const systeme = construireSystemeNarration(roster, regles, pseudo);

    // 5. Le MJ raconte (le SEUL appel payant du tour).
    const narration = await genererNarration(systeme, historiquePourLLM);

    // 6. Je grave la réponse du MJ.
    enregistrerMessage(id_utilisateur, id_campagne, 'MJ', narration);

    return narration;
}
