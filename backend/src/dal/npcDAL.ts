import {getDb} from "../db/db";


const db = getDb();
export type NpcStatut = 'ACTIF' | 'INACTIF' | 'MORT';

export interface Npc {
    id_npc: number;
    id_campagne: number;
    id_organisation: number;
    slug: string;
    nom: string;
    description: string |null;
    fiche_json: string |null;
    statut: NpcStatut;
    relation_pc: number;
    date_creation: string;
}

// CRUD : NPC !

// CREATE

export function insertNpcDal(id_campagne: number,
                          id_organisation: number,
                          slug: string,
                          nom: string,
                          description: string |null,
                          fiche_json: string) {
    const stmt = db.prepare(`
    INSERT INTO NPC (id_campagne, id_organisation, slug, nom, description, fiche_json, statut)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIF')
`);

    const result = stmt.run(id_campagne, id_organisation, slug, nom, description, fiche_json);

    const createdNpc = getNpcByIdDal(Number(result.lastInsertRowid));

    if (!createdNpc) {
    throw new Error('Personnage non joueur créé, mais impossible à relire en base');
    }

    return createdNpc;
}

// READ

export function getNpcByIdDal(id_npc: number):Npc | null {
    const stmt = db.prepare(`
    SELECT  id_npc,
            id_campagne,
            id_organisation,
            slug,
            nom,
            description,
            fiche_json,
            statut,
            relation_pc,
            date_creation
    FROM NPC
    WHERE id_npc = ?
`);

    const npc = stmt.get(id_npc) as Npc | undefined;

    return npc ?? null;
}

export function getNpcBySlugDal(id_campagne: number, slug: string):Npc | null {
    const stmt = db.prepare(`
    SELECT  id_npc,
            id_campagne,
            id_organisation,
            slug,
            nom,
            description,
            fiche_json,
            statut,
            relation_pc,
            date_creation
    FROM NPC
    WHERE id_campagne = ? AND slug = ?
    `);

    const npc = stmt.get(id_campagne, slug) as Npc | undefined;

    return npc ?? null;
}

export function getNpcsByCampagneDal(id_campagne: number, statut?: NpcStatut) {
    // Requête de base : on récupère les NPC de la campagne.
    let sql = `SELECT id_npc,
                      id_campagne,
                      id_organisation,
                      slug,
                      nom,
                      description,
                      fiche_json,
                      statut,
                      relation_pc,
                      date_creation
               FROM NPC WHERE id_campagne = ?`;

    // Paramètres associés aux ? de la requête.
    const params: (number | string)[] = [id_campagne];

    // Si un statut est fourni, on ajoute le filtre correspondant.
    if (statut) {
        sql += ` AND statut = ?`;
        params.push(statut);
    }

    // On prépare la requête une fois complète.
    return db.prepare(sql).all(...params) as Npc[];
}

export function updateNpcDal(id_npc: number, id_organisation: number, nom: string, description: string | null, fiche_json: string, statut: NpcStatut, relation_pc: number) {
    const stmt = db.prepare(`
    UPDATE NPC
    SET id_organisation = ?,
        nom = ?,
        description = ?,
        fiche_json = ?,
        statut = ?,
        relation_pc = ?
    WHERE id_npc = ?
`);
    const result = stmt.run(id_organisation, nom, description, fiche_json, statut, relation_pc, id_npc);
    if (result.changes === 0) {
        return null
    }
    return getNpcByIdDal(id_npc)
}

export function deleteNpcDal(id_npc: number):boolean {
    const stmt = db.prepare(`
    DELETE FROM NPC WHERE id_npc = ?
`);
    const result = stmt.run(id_npc);

    if (result.changes === 0) {
        throw new Error('Ce NPC n\'existe pas');
    }
    return true
}


