import {getDb} from "../db/db";
import {Checkpoint, getMaxOrdreCheckpointDal, insertCheckpointDal} from "../dal/checkpointDAL";
import {assertProprietaireCampagne} from "./campagneService";
import {getArcByIdDal} from "../dal/arcDAL";
import {MemoireProposee} from "../schema/memoireSchema";
import {applyMem} from "./memoireService";
import { Memoire } from "../dal/memoireDAL";

const db = getDb();

export function createCheckpoint(params: {
                                    id_utilisateur: number;
                                    id_campagne: number;
                                    id_arc: number;
                                    titre: string;
                                    contenu: string;
                                    resume: string;
                                    memoires?: MemoireProposee[]
}): { checkpoint: Checkpoint, memoires: Memoire[] } {
    const {id_utilisateur, id_campagne, id_arc, titre, contenu, resume} = params;       //Notion super sympa : On évite de se perdre
    const memoires = params.memoires ?? [];

    const transaction = db.transaction((): { checkpoint: Checkpoint, memoires: Memoire[] } => {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    const arc = getArcByIdDal(id_arc);
    if (!arc || arc.id_campagne !== id_campagne) {
        throw new Error('Arc introuvable'); // → 404
    }

    const ordre = getMaxOrdreCheckpointDal(id_campagne) + 1;
    const checkpoint = insertCheckpointDal(id_arc, titre, contenu, resume, ordre);
    const memoiresCreees = applyMem(id_campagne, checkpoint.id_checkpoint, ordre, memoires);

    return { checkpoint, memoires: memoiresCreees };
});

    return transaction();
}



