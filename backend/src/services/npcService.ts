import { getDb } from "../db/db";
import {
    deleteNpcDal,
    getNpcByIdDal,
    getNpcsByCampagneDal,
    insertNpcDal,
    Npc,
    NpcStatut,
    updateNpcDal
} from "../dal/npcDAL";
import { getCampagneByIdDal } from "../dal/campagneDAL";
import {assertProprietaireCampagne} from "./campagneService";


const db = getDb();

export function createNpc(id_utilisateur: number,
                          id_campagne: number,
                          id_organisation: number,
                          slug: string,
                          nom: string,
                          description: string | null,
                          fiche_json: string,
): Npc {

    const transaction = db.transaction((): Npc => {
        assertProprietaireCampagne(id_campagne, id_utilisateur);

        return insertNpcDal(id_campagne, id_organisation, slug, nom, description, fiche_json);
    });

    return transaction();
}

export function getNpcById(id_npc: number, id_utilisateur: number): Npc {
    return assertProprietaireNpc(id_npc, id_utilisateur);
}

export function getNpcsByCampagne(id_campagne: number, id_utilisateur: number): Npc[] {
    assertProprietaireCampagne(id_campagne, id_utilisateur);
    return getNpcsByCampagneDal(id_campagne);
}

export function updateNpc(id_utilisateur: number, id_npc: number, id_organisation: number, nom: string, description: string | null, fiche_json: string, statut: NpcStatut, relation_pc: number): Npc | null {
    assertProprietaireNpc(id_npc, id_utilisateur);
    return updateNpcDal(id_npc, id_organisation, nom, description, fiche_json, statut, relation_pc);
}

export function deleteNpc(id_npc: number, id_utilisateur: number): void {
    assertProprietaireNpc(id_npc, id_utilisateur);
    deleteNpcDal(id_npc);
}


// En gros : 1. On récupère un NPC via son id.
// 2. on récupère la campagne par l'id_campagne du npc
// 3. On vérifie que l'id_utilisateur de campagne par rapport à celui donné en paramètre
// Conclusion : On fait le labyrinthe par l'entrée et la sortie en quelque sorte, pour matcher.
function assertProprietaireNpc(id_npc: number, id_utilisateur: number): Npc {
    const npc = getNpcByIdDal(id_npc);

    if (!npc) {
        throw new Error('NPC introuvable');
    }

    const campagne = getCampagneByIdDal(npc.id_campagne);

    if (!campagne) {
        throw new Error('Campagne introuvable'); // → 404 dans la route
    }
    if (campagne.id_utilisateur !== id_utilisateur) {
        throw new Error('Accès interdit'); // → 403 dans la route
    }

    return npc;
}