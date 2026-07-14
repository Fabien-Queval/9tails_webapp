import {getDb} from "../db/db";


const db = getDb();

export type Emetteur = 'JOUEUR' | 'MJ'

export interface Message {
    id_message: number;
    id_campagne: number;
    emetteur: Emetteur;
    contenu: string;
    ordre: number;
    date_creation: string;
}

// CRUD

// CREATE

// ⚠️ Fragilité n°1 — emetteur / contenu sont 2 string voisins : TS ne verra PAS une inversion.
//    Filet de secours en base : le CHECK CK_MESSAGE_EMETTEUR (un contenu ≠ 'JOUEUR'/'MJ' → rejet).
export function insertMessageDal(id_campagne: number,
                                 emetteur: Emetteur,
                                 contenu: string,
                                 ordre: number): Message {
    const stmt = db.prepare(`
    INSERT INTO MESSAGE (id_campagne, emetteur, contenu, ordre)
    VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(id_campagne, emetteur, contenu, ordre);

    const createdMessage = getMessageByIdDal(Number(result.lastInsertRowid));

    if (!createdMessage) {
        throw new Error('Message créé, mais impossible à relire en base')
    }
    return createdMessage;
}

// READ

export function getMessageByIdDal(id_message: number): Message | null {
    const stmt = db.prepare(`
    SELECT id_message,
           id_campagne,
           emetteur,
           contenu,
           ordre,
           date_creation
    FROM MESSAGE
    WHERE id_message = ?
    `);

    const message = stmt.get(id_message) as Message | undefined;

    return message ?? null;
}

// Je récupère le plus grand ordre du fil de cette campagne (comme l'ARC) — le Service fera +1.
export function getMaxOrdreMessageDal(id_campagne: number): number {
    const stmt = db.prepare(`
        SELECT COALESCE(MAX(ordre), 0) AS maxOrdre
        FROM MESSAGE
        WHERE id_campagne = ?
    `);

    const result = stmt.get(id_campagne) as { maxOrdre: number };

    return result.maxOrdre;
}

// La fenêtre glissante : je prends les N derniers messages du fil (les plus récents),
// mais je les RENDS dans l'ordre chronologique — le LLM doit lire du plus vieux au plus récent.
export function getDerniersMessagesDal(id_campagne: number, limite: number): Message[] {
    const stmt = db.prepare(`
        SELECT id_message,
               id_campagne,
               emetteur,
               contenu,
               ordre,
               date_creation
        FROM MESSAGE
        WHERE id_campagne = ?
        ORDER BY ordre DESC
        LIMIT ?
    `);

    const messages = stmt.all(id_campagne, limite) as Message[];

    // Je les ai lus du + récent au + ancien (DESC) pour attraper les bons ; je les remets à l'endroit.
    return messages.reverse();
}
