import {getDb} from "../db/db";


const db = getDb();
export type CampagneStatut = 'BROUILLON' | 'ACTIVE' | 'ARCHIVEE';

export interface Campagne {
    id_campagne: number;
    id_utilisateur: number;
    titre: string;
    genre: string;
    description: string | null;
    maturite: number;
    statut: CampagneStatut;
    date_creation: string;
}

export interface Organisation {
    id_organisation: number;
    id_campagne: number;
    slug: string;
    nom: string;
    description: string;
    relation_pc: number;
    date_creation: string;
}

export interface Journal {
    id_journal: number;
    id_campagne: number;
    titre: string;
    description: string | null;
    date_creation: string;
}

//CRUD : Campagne !

// CREATE
export function insertCampagneDal(id_utilisateur: number,
                                  titre: string,
                                  genre: string,
                                  description: string | null,
                                  maturite: number) {
    const stmt = db.prepare(`
    INSERT INTO CAMPAGNE (id_utilisateur, titre, genre, description, maturite, statut)
    VALUES (?, ?, ?, ?, ?, 'BROUILLON')
    `);

    const result = stmt.run(id_utilisateur, titre, genre, description, maturite);

    const createdCampagne = getCampagneByIdDal(Number(result.lastInsertRowid));

    if (!createdCampagne) {
        throw new Error ('Campagne créée, mais impossible à relire en base');
    }

    return createdCampagne
}

export function insertOrganisationSentinelleDal(id_campagne: number) {
    const stmt = db.prepare(`
    INSERT INTO ORGANISATION (id_campagne, slug, nom, description, relation_pc)
    VALUES (?, 'org_aucune', 'Aucune organisation', 'Organisation sentinelle', 0);
`);
    const result = stmt.run(id_campagne);

    if (result.changes === 0) {
        throw new Error('Organisation sentinelle non créée');
    }
}


export function insertJournalDal(id_campagne: number, titre: string) {
    const stmt = db.prepare(`
    INSERT INTO JOURNAL (id_campagne, titre)
    VALUES (?, ?);
`);
    const result = stmt.run(id_campagne, titre);

    if (result.changes === 0) {
        throw new Error('Journal non créée');
    }
}

// READ
export function getCampagneByIdDal(id_campagne: number): Campagne | null {
    const stmt = db.prepare(`
    SELECT id_campagne,
           id_utilisateur,
           titre,
           genre,
           description,
           maturite,
           statut,
           date_creation
    FROM CAMPAGNE
    WHERE id_campagne = ?
`);

    const campagne = stmt.get(id_campagne) as Campagne | undefined;
    
    return campagne ?? null;
}

export function getCampagnesByUtilisateurDal(id_utilisateur: number, statut?: CampagneStatut) {
    let sql = `SELECT id_campagne,
                            id_utilisateur,
                            titre,
                            genre,
                            description,
                            maturite,
                            statut,
                            date_creation
                    FROM CAMPAGNE WHERE id_utilisateur = ?`;
    const params : (number | string)[] = [id_utilisateur];

    if (statut) {
        sql += ` AND statut = ?`;
        params.push(statut);
    }

    return db.prepare(sql).all(...params) as Campagne[];
}

export function getOrganisationSentinelleDal(id_campagne: number): number {
    const stmt = db.prepare(`
    SELECT id_organisation
    FROM ORGANISATION
    WHERE id_campagne = ? AND slug = 'org_aucune'
    `);
    const result = stmt.get(id_campagne) as { id_organisation: number }| undefined;

    if (!result) {
        throw new Error('Organisation sentinelle introuvable'); // Ne devrait jamais arriver
    }
    return result.id_organisation;
}

// UPDATE

export function updateCampagneDal(id_campagne: number, titre: string, description: string |null, maturite: number) {
    const stmt = db.prepare(`
    UPDATE CAMPAGNE
    SET titre = ?,
        description = ?,
        maturite = ?
    WHERE id_campagne = ?
`);
    const result = stmt.run(titre, description, maturite, id_campagne);
    if (result.changes === 0) {
        return null;
    }

    return getCampagneByIdDal(id_campagne)
}

export function updateStatutDal(id_campagne: number, statut: CampagneStatut) {
    const stmt = db.prepare(`
    UPDATE CAMPAGNE
    SET statut = ?
    WHERE id_campagne = ?
`);
    const result = stmt.run(statut, id_campagne);
    if (result.changes === 0) {
        return null;
    }
    return getCampagneByIdDal(id_campagne)
}

// DELETE

 export function deleteCampagneDal(id_campagne: number): boolean {
    const stmt = db.prepare(`
    DELETE FROM CAMPAGNE
    WHERE id_campagne = ?
 `);

    const result = stmt.run(id_campagne);

    if (result.changes === 0) {
        throw new Error('Cette campagne n\'existe pas !');
    }

    return true
 }