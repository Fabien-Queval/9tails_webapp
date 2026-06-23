import {
    Arc,
    ArcStatut,
    getArcByIdDal,
    getArcsByCampagneDal,
    getMaxOrdreArcDal,
    insertArcDal,
    updateStatutArcDal
} from "../dal/arcDAL";
import {getDb} from "../db/db";
import {assertProprietaireCampagne} from "./campagneService";

const db = getDb();

export function createArc(  id_utilisateur: number, id_campagne: number, titre: string,  resume: string): Arc {
    const transaction =  db.transaction((): Arc => {
        assertProprietaireCampagne(id_campagne, id_utilisateur);

        const ordre = getMaxOrdreArcDal(id_campagne) +1;

        return insertArcDal(id_campagne, titre, resume, ordre);
    });

    return transaction();
}

export function getArcsByCampagne(id_campagne: number, id_utilisateur: number, statut?: ArcStatut): Arc[] {
    assertProprietaireCampagne(id_campagne, id_utilisateur);
    return getArcsByCampagneDal(id_campagne, statut);
}

export function terminerArc(id_utilisateur: number, id_campagne: number, id_arc: number): Arc | null {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    const arc = getArcByIdDal(id_arc);
    if (!arc || arc.id_campagne !== id_campagne) {   // <-- le garde anti-IDOR
        throw new Error('Arc introuvable');           // → 404
    }
    if (arc.statut !== 'EN_COURS') {
        throw new Error('Seul un arc en cours peut être clôturé');   // → 409
    }
    return updateStatutArcDal(id_arc, 'TERMINE');
}