import {getDb} from "../db/db";

const db= getDb();


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

