/*
 * PARKÉ le 16/07 — changement de fusil d'épaule.
 *
 * Cette 1re version photographiait les ENTITÉS courantes (campagne + arc + PC + NPCs) :
 * une coupe transversale du monde à l'instant T.
 *
 * Modèle retenu après discussion : le snapshot ASSEMBLE LES CHECKPOINTS —
 * la chronologie de leurs résumés, l'histoire compactée de la campagne.
 * generateSnapshot() sera réécrit en "factory" au-dessus des checkpoints,
 * une fois la logique de création de checkpoint (le débrief) confirmée.
 *
 * Code d'origine conservé ci-dessous pour mémoire.
 * ---------------------------------------------------------------------------------------------

import { assertProprietaireCampagne } from "./campagneService";
import {getNpcsByCampagneDal} from "../dal/npcDAL";
import {getCampagneByIdDal} from "../dal/campagneDAL";
import {getArcsByCampagneDal} from "../dal/arcDAL";
import {getPersonnageByCampagneDal} from "../dal/personnageDal";

export function generateSnapshot(id_campagne: number, id_utilisateur: number) {
    // Garde IDOR : je refuse un intrus AVANT toute lecture.
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    // --- Les lectures : je vais chercher l'état de la campagne en base ---
    const campagne = getCampagneByIdDal(id_campagne);
    const arcsEnCours      = getArcsByCampagneDal(id_campagne, 'EN_COURS');
    const arcCourant        = arcsEnCours[arcsEnCours.length - 1];   // l'acte actif = le plus récent
    const pc      = getPersonnageByCampagneDal(id_campagne);
    const npcsActifs      = getNpcsByCampagneDal(id_campagne, 'ACTIF');

    // Garde-fou : la campagne existe forcément (l'IDOR l'a prouvé), mais TS ne le sait pas.
    if (!campagne) throw new Error('Campagne introuvable');

// --- J'assemble le document : je CHOISIS les champs, je ne déverse pas les lignes brutes ---
    const snapshot = {
        genere_le: new Date().toISOString(),

        campagne: {
            titre:       campagne.titre,
            genre:       campagne.genre,
            description: campagne.description,
        },

        arc_courant: arcCourant
            ? { titre: arcCourant.titre, resume: arcCourant.resume }
            : null,

        personnage: pc
            ? { slug: pc.slug_pc, nom: pc.nom, description: pc.description }
            : null,

        npcs_actifs: npcsActifs.map(npc => ({
            slug:        npc.slug,
            nom:         npc.nom,
            description: npc.description,
            relation_pc: npc.relation_pc,
        })),
    };
}

 * ---------------------------------------------------------------------------------------------
 */
