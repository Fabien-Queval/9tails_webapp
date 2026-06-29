import {getDb} from "../db/db";
import {Checkpoint, getCheckpointByIdDal, getMaxOrdreCheckpointDal, insertCheckpointDal} from "../dal/checkpointDAL";
import {assertProprietaireCampagne} from "./campagneService";
import {getArcByIdDal} from "../dal/arcDAL";

const db = getDb();

export function createCheckpoint(params: {
                                    id_utilisateur: number;
                                    id_campagne: number;
                                    id_arc: number;
                                    titre: string;
                                    contenu: string;
                                    resume: string;
                                        }): Checkpoint {
    const {id_utilisateur, id_campagne, id_arc, titre, contenu, resume} = params;       //Notion super sympa : On évite de se perdre
    const transaction = db.transaction((): Checkpoint => {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    const arc = getArcByIdDal(id_arc);
    if (!arc || arc.id_campagne !== id_campagne) {
        throw new Error('Arc introuvable'); // → 404
    }

    const ordre = getMaxOrdreCheckpointDal(id_campagne) + 1;

    return insertCheckpointDal(id_arc, titre, contenu, resume, ordre);
});

    return transaction();
}



