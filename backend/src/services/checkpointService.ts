import {getDb} from "../db/db";
import {Checkpoint, getMaxOrdreCheckpointDal, insertCheckpointDal} from "../dal/checkpointDAL";
import {assertProprietaireCampagne} from "./campagneService";
import {getArcByIdDal} from "../dal/arcDAL";
import {MemoireProposee} from "../schema/memoireSchema";
import {applyMem} from "./memoireService";
import { Memoire } from "../dal/memoireDAL";
import {insertNpcDal, Npc} from "../dal/npcDAL";
import {getOrganisationSentinelleDal} from "../dal/campagneDAL";
import {slugNpc} from "../utils/slug";
import { NouveauPersonnage } from "../schema/debriefSchema";

const db = getDb();

export function createCheckpoint(params: {
    id_utilisateur: number;
    id_campagne: number;
    id_arc: number;
    titre: string;
    contenu: string;
    resume: string;
    nouveauxPersonnages?: NouveauPersonnage[];
    memoires?: MemoireProposee[];
}): { checkpoint: Checkpoint; npcs: Npc[]; memoires: Memoire[] } {
    const { id_utilisateur, id_campagne, id_arc, titre, contenu, resume } = params;
    const nouveauxPersonnages = params.nouveauxPersonnages ?? [];
    const memoires = params.memoires ?? [];

    const transaction = db.transaction(() => {
        assertProprietaireCampagne(id_campagne, id_utilisateur);

        const arc = getArcByIdDal(id_arc);
        if (!arc || arc.id_campagne !== id_campagne) throw new Error('Arc introuvable');    // -> 404

        const ordre = getMaxOrdreCheckpointDal(id_campagne) + 1;
        const checkpoint = insertCheckpointDal(id_arc, titre, contenu, resume, ordre);

        // Les nouveaux PNJ AVANT les memoires -> elles pourront les retrouver par slug.
        const idOrga = getOrganisationSentinelleDal(id_campagne);
        const npcsCrees = nouveauxPersonnages.map(p =>
            insertNpcDal(id_campagne, idOrga, slugNpc(p.nom), p.nom, p.description, '{}')
        );

        // Les memoires : applyMem retrouve chaque PNJ (existant OU tout juste cree).
        const memoiresCreees = applyMem(id_campagne, checkpoint.id_checkpoint, ordre, memoires);

        return { checkpoint, npcs: npcsCrees, memoires: memoiresCreees };
    });

    return transaction();
}
