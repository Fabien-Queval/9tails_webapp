import {getDb} from "../db/db";


const db = getDb();

export type CibleType = 'NPC' | 'PC' | 'OBJET' | 'LIEU' | 'ORGANISATION'

export interface Memoire {
    id_memoire: number;
    id_npc: number;
    id_checkpoint: number;
    slug_memoire: string;
    contenu: string;
    cible_type: CibleType | null;
    cible_slug: string | null;
    date_creation: string;
}

// CRUD

// CREATE

// ⚠️ Fragilité n°1 — paramètres de même type collés : slug_memoire / contenu sont 2 string voisins.
//    TS ne détecte PAS une inversion entre deux args de même type (cf. id_utilisateur/id_campagne, 19/06).
//    Filet de secours ici : le CHECK regex du slug en base. Parade durable : passer un objet nommé { ... }.
export function insertMemoireDal (id_npc: number,
                                  id_checkpoint: number,
                                  slug_memoire: string,
                                  contenu: string,
                                  cible_type: CibleType | null,
                                  cible_slug: string | null): Memoire {
    const stmt = db.prepare(`
    INSERT INTO MEMOIRE (id_npc, id_checkpoint, slug_memoire, cible_type, cible_slug, contenu)
    VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(id_npc, id_checkpoint, slug_memoire, cible_type, cible_slug, contenu);

    const createdMemoire = getMemoireByIdDal(Number(result.lastInsertRowid));

    if (!createdMemoire) {
        throw new Error('Mémoire créée, mais impossible à relire en base')
    }
    return createdMemoire;
}

// READ

export function getMemoireByIdDal (id_memoire: number): Memoire | null {
    const stmt = db.prepare(`
    SELECT id_memoire,
           id_npc,
           id_checkpoint,
           slug_memoire,
           cible_type,
           cible_slug,
           contenu,
           date_creation
    FROM MEMOIRE
    WHERE id_memoire = ?
    `);

    const memoire = stmt.get(id_memoire) as Memoire | null | undefined;

    return memoire ?? null;
}

export function getMemoireByNpcDal (id_npc: number): Memoire[] {
    const stmt = db.prepare(`
        SELECT id_memoire,
               id_npc,
               id_checkpoint,
               slug_memoire,
               cible_type,
               cible_slug,
               contenu,
               date_creation
        FROM MEMOIRE
        WHERE id_npc = ?
        `);

    const memoires = stmt.all(id_npc) as Memoire [];
    return memoires;

}