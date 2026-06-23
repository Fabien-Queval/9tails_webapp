import {getDb} from "../db/db";

const db = getDb()
export type ArcStatut = 'EN_COURS' | 'TERMINE' | 'ARCHIVE' | 'BROUILLON'

export interface Arc {
    id_arc: number;
    id_campagne: number;
    titre: string;
    resume: string | null;   // nullable au schéma, mais on le remplit toujours
    statut: ArcStatut;
    ordre: number;
    date_creation: string;
}


// CREATE

export function insertArcDal(id_campagne: number, titre: string, resume: string, ordre: number): Arc {
    const stmt = db.prepare(`
    INSERT INTO ARC (id_campagne, titre, resume, statut, ordre)
    VALUES (?, ?, ?, 'EN_COURS', ?)
    `);
    const result = stmt.run(id_campagne, titre, resume, ordre);

    const createdArc = getArcByIdDal(Number(result.lastInsertRowid));

    if (!createdArc) {
        throw new Error ('Arc créé, mais impossible à relire en base')
    }

    return createdArc;
}

// READ

export function getArcByIdDal(id_arc: number): Arc | null {
    const stmt = db.prepare(`
    SELECT id_arc,
    id_campagne,
    titre,
    resume,
    statut,
    ordre,
    date_creation
    FROM ARC
    WHERE id_arc = ?
    `);

    const arc = stmt.get(id_arc) as Arc | undefined

    return arc ?? null;
}

export function getMaxOrdreArcDal(id_campagne: number): number {
    const stmt = db.prepare(`
        SELECT COALESCE(MAX(ordre), 0) AS maxOrdre
        FROM ARC
        WHERE id_campagne = ?
    `);

    const result = stmt.get(id_campagne) as { maxOrdre: number };

    return result.maxOrdre;
}


export function getArcsByCampagneDal(id_campagne: number, statut?: ArcStatut): Arc[] {
    let sql = `SELECT
                        id_arc,
                        id_campagne,
                        titre,
                        resume,
                        statut,
                        ordre,
                        date_creation
                        FROM ARC                  
                        WHERE id_campagne = ?`;
    const params: (number | string)[] = [id_campagne];

    if (statut) {
        sql += ` AND statut = ?`;
        params.push(statut);
    }
    sql += ` ORDER BY ordre`;

    return db.prepare(sql).all(...params) as Arc[];

}

// UPDATE

export function updateStatutArcDal(id_arc: number, statut: ArcStatut): Arc | null {
    const stmt = db.prepare(`
    UPDATE ARC
    SET statut = ? WHERE id_arc = ?
    `);
    const result = stmt.run(statut, id_arc);
    if (result.changes === 0) {
        return null;
    }
    return getArcByIdDal(id_arc)
}
