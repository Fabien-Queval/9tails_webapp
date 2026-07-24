import { assertProprietaireCampagne } from "./campagneService";
import { lireFilRecent } from "./messageService";
import { getArcsByCampagneDal } from "../dal/arcDAL";
import { getPersonnageByCampagneDal } from "../dal/personnageDal";
import { getNpcsByCampagneDal } from "../dal/npcDAL";
import { serialiserRoster } from "./memoireService";
import { genererDebrief, construireSystemeDebrief, MessageLLM } from "./llmService";

const NB_MESSAGES_DEBRIEF = 100;   // la fenetre a resumer : la scene entiere, genereux

// PROPOSE-ONLY : je ne grave RIEN ici.
// Maia synthetise la scene close et PROPOSE (titre/resume/contenu + nouveaux PNJ + souvenirs).
// L'humain valide dans la modale de cloture, PUIS le commit passe par la route checkpoint.
// (archi S3 : le LLM propose, l'humain valide.)
export async function debriefer(id_utilisateur: number, id_campagne: number, id_arc: number) {
    assertProprietaireCampagne(id_campagne, id_utilisateur);   // garde IDOR d'abord

    // 1. Le fil a resumer, mappe au format API (comme dans jouerTour).
    const fil = lireFilRecent(id_utilisateur, id_campagne, NB_MESSAGES_DEBRIEF);
    const filPourLLM: MessageLLM[] = fil.map(m => ({
        role: m.emetteur === 'JOUEUR' ? 'user' : 'assistant',
        content: m.contenu,
    }));

    // 2. Le contexte de l'arc + le roster COMPLET (tous statuts, pour la regle d'unicite).
    const arcsEnCours  = getArcsByCampagneDal(id_campagne, 'EN_COURS');
    const arcCourant   = arcsEnCours[arcsEnCours.length - 1];
    const contexteArc  = arcCourant?.resume ?? '';

    const pc           = getPersonnageByCampagneDal(id_campagne);
    const tousLesNpcs  = getNpcsByCampagneDal(id_campagne);   // SANS filtre = tous les statuts
    const rosterComplet = serialiserRoster(pc, tousLesNpcs);

    // 3. J'assemble le prompt et j'appelle Maia -> une PROPOSITION, rien n'est grave.
    const systeme = construireSystemeDebrief(rosterComplet, contexteArc);
    const debrief = await genererDebrief(systeme, filPourLLM);

    // Je renvoie la proposition + l'arc cible. Le commit (checkpoint + PNJ + memoires)
    // viendra APRES validation humaine, via la route checkpoint.
    return { debrief, id_arc };
}
