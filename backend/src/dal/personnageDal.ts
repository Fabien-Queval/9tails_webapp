import {getDb} from "../db/db";


const db = getDb();

export interface Personnage {
    id_personnage: number;
    id_campagne: number;
    id_utilisateur: number;
    slug_pc: string;
    nom: string;
    description: string;
    fiche_json: string;
    date_creation: string;
}

// CRUD

// CREATE

export function insertPersonnageDal(id_campagne: number, id_utilisateur: number, slug_pc: string, nom: string, description: string, fiche_json: string) {
    const stmt = db.prepare(`
    INSERT INTO PERSONNAGE (id_campagne, id_utilisateur, slug_pc, nom, description, fiche_json) 
    VALUES (?, ?, ?, ?, ?, ?)
`);

    const result = stmt.run(id_campagne, id_utilisateur, slug_pc, nom, description, fiche_json);

    const createdPersonnage = getPersonnageByIdDal(Number(result.lastInsertRowid));

    if (!createdPersonnage) {
        throw new Error('Personnage Joueur créé, mais impossible à relire en base')
    }

    return createdPersonnage;
}

// READ

export function getPersonnageByIdDal(id_personnage: number): Personnage | null {
    const stmt = db.prepare(`
    SELECT  id_personnage,
            id_campagne,
            id_utilisateur,
            slug_pc,
            nom,
            description,
            fiche_json,
            date_creation
    FROM PERSONNAGE
    WHERE id_personnage = ?
`);

    const personnage = stmt.get(id_personnage) as Personnage | undefined;

    return personnage ?? null;
}

export function getPersonnageByCampagneDal(id_campagne: number): Personnage | null {
    const stmt = db.prepare(`
    SELECT  id_personnage,
            id_campagne,
            id_utilisateur,
            slug_pc,
            nom,
            description,
            fiche_json,
            date_creation
    FROM PERSONNAGE
    WHERE id_campagne = ?
`)
    const personnage = stmt.get(id_campagne) as Personnage | undefined;

    return personnage ?? null;
}

//UPDATE

export function updatePersonnageDal(id_personnage: number, description: string, fiche_json: string) {
    const stmt = db.prepare(`
    UPDATE PERSONNAGE 
    SET description = ?,
        fiche_json = ?
    WHERE id_personnage = ?
`)
    const result = stmt.run(description, fiche_json, id_personnage);
    if(result.changes === 0) {
        return null
    }
    return getPersonnageByIdDal(id_personnage)
}

// DELETE

export function deletePersonnageDal(id_personnage: number): boolean {
    const stmt = db.prepare(`
    DELETE FROM PERSONNAGE
    WHERE id_personnage = ?
`);
    const result = stmt.run(id_personnage);

    if(result.changes === 0) {
        throw new Error('Ce personnage n\'existe pas !');
    }
    return true
}