import {getDb} from "../db/db";


const db = getDb()

export interface Checkpoint {
    id_checkpoint: number,
    id_arc: number,
    titre: string,
    contenu: string,
    resume: string | null, //nullable, mais toujours rempli
    ordre: number,
    date_creation: string;
}

// CRUD

// Create

export function insertCheckpointDal(id_arc: number,
                                    titre: string,
                                    contenu: string,
                                    resume: string,
                                    ordre: number): Checkpoint {
    const stmt = db.prepare(`
    INSERT INTO CHECKPOINT(id_arc,
                           titre,
                           contenu,
                           resume,
                           ordre)
    VALUES (?, ?, ?, ?, ?)
    `);

    const result =  stmt.run(id_arc, titre, contenu, resume, ordre);

    const createdCheckpoint = getCheckpointByIdDal(Number(result.lastInsertRowid));

    if (!createdCheckpoint) {
        throw new Error('Checkpoint crée, mais impossible à relire en base')
    }
    return createdCheckpoint;
}

// Read

export function getCheckpointByIdDal(id_checkpoint: number): Checkpoint | null {
    const stmt = db.prepare(`
    SELECT id_checkpoint,
           id_arc,
           titre,
           contenu,
           resume,
           ordre,
           date_creation
    FROM CHECKPOINT
    WHERE id_checkpoint = ?
    `);

    const checkpoint = stmt.get(id_checkpoint) as Checkpoint | undefined
    return checkpoint ?? null;
}

export function getMaxOrdreCheckpointDal(id_campagne: number): number {
    const stmt = db.prepare(`
    SELECT COALESCE(MAX(CHECKPOINT.ordre), 0) AS maxOrdre
    FROM CHECKPOINT
    JOIN ARC ON CHECKPOINT.id_arc = ARC.id_arc
    WHERE id_campagne = ?
    `);

    const result = stmt.get(id_campagne) as {maxOrdre: number};

    return result.maxOrdre;
}

export function getCheckpointsByCampagneDal(id_campagne: number): Checkpoint[] {
    const stmt = db.prepare(`
    SELECT CHECKPOINT.id_checkpoint,
           CHECKPOINT.id_arc,
           CHECKPOINT.titre,
           CHECKPOINT.contenu,
           CHECKPOINT.resume,
           CHECKPOINT.ordre,
           CHECKPOINT.date_creation
    FROM CHECKPOINT
    JOIN ARC ON CHECKPOINT.id_arc = ARC.id_arc
    WHERE ARC.id_campagne = ?
    ORDER BY ARC.ordre, CHECKPOINT.ordre
    `);

    return stmt.all(id_campagne) as Checkpoint[];
}

