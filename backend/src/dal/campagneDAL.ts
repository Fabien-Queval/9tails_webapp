import {getDb} from "../db/db";

const db = getDb();
type CampagneStatut = 'BROUILLON' | 'ACTIVE' | 'ARCHIVEE';

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
export function insertCampagne(id_utilisateur: number,
                               titre: string,
                               genre: string,
                               description: string | null,
                               maturite: number,) {
    const stmt = db.prepare(`
    INSERT INTO CAMPAGNE (id_utilisateur, titre, genre, description, maturite, statut)
    VALUES (?, ?, ?, ?, ?, 'BROUILLON')
    `);

    const result = stmt.run(id_utilisateur, titre, genre, description, maturite);

    const createdCampagne = getCampagneById(Number(result.lastInsertRowid));

    if (!createdCampagne) {
        throw new Error ('Campagne créée, mais impossible à relire en base');
    }

    return createdCampagne
}

export function insertOrganisationSentinelle(id_campagne: number) {
    const stmt = db.prepare(`
    INSERT INTO ORGANISATION (id_campagne, slug, nom, description, relation_pc)
    VALUES (?, 'org_aucune', 'Aucune organisation', 'Organisation sentinelle', 0);
`);
    const result = stmt.run(id_campagne);

    if (result.changes === 0) {
        throw new Error('Organisation sentinelle non créée');
    }
}

export function insertJournal(id_campagne: number, titre: string) {
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
export function getCampagneById(id_campagne: number): Campagne | null {
    const stmt = db.prepare(`
    SELECT id_campagne, id_utilisateur, titre, genre, description, maturite, statut, date_creation
    FROM CAMPAGNE
    WHERE id_campagne = ?
`);

    const campagne = stmt.get(id_campagne) as Campagne | undefined;
    
    return campagne ?? null;
}



// UPDATE

// DELETE

