// Les accolades { getDb } indiquent qu'on importe un export nommé.
import { getDb } from '../db/db';

const db = getDb();

export interface User {
    id_utilisateur: number;

    email: string;
    pseudo: string;

    // On stocke le mot de passe hashé, jamais le mot de passe brut.
    mot_de_passe_hash: string;

    date_creation: string;
}

// CRUD = Create, Read, Update, Delete.

// export permet d'utiliser cette fonction dans d'autres fichiers.
// Le : User indique que la fonction doit retourner un utilisateur complet.
export function createUser(email: string, pseudo: string, mot_de_passe_hash: string): User {
    // prepare() prépare une requête SQL sans encore l'exécuter.
    // Les ? sont des emplacements sécurisés : ils seront remplacés par les valeurs de run().
    // Cela évite d'injecter directement des variables dans le SQL.
    const stmt = db.prepare(`
        INSERT INTO UTILISATEUR (email, pseudo, mot_de_passe_hash)
        VALUES (?, ?, ?)
    `);

    // run() exécute une requête qui modifie la BDD : INSERT, UPDATE ou DELETE.
    // Les valeurs remplacent les ? dans l'ordre :
    // 1er ? = email, 2e ? = pseudo, 3e ? = passwordHash.
    const result = stmt.run(email, pseudo, mot_de_passe_hash);

    // lastInsertRowid contient l'id de la dernière ligne insérée.
    // Number(...) convertit cette valeur en nombre.
    // On relit ensuite l'utilisateur pour récupérer l'objet complet,
    // avec son id et sa date de création.
    const createdUser = getUserById(Number(result.lastInsertRowid));

    // Si createdUser vaut null, cela veut dire que la relecture a échoué.
    // throw déclenche une erreur et arrête immédiatement la fonction.
    if (!createdUser) {
        throw new Error('Utilisateur créé mais impossible à relire en base');
    }

    // return renvoie le résultat final de la fonction.
    return createdUser;
}

// READ : cette fonction cherche un utilisateur par son id.
// User | null signifie : soit on trouve un User, soit on ne trouve rien.
export function getUserById(id_utilisateur: number): User | null {
    const stmt = db.prepare(`
        SELECT id_utilisateur, email, pseudo, mot_de_passe_hash, date_creation
        FROM UTILISATEUR
        WHERE id_utilisateur = ?
    `);

    // get() sert à récupérer une seule ligne.
    // Ici, on cherche un seul utilisateur par id.
    // "as User | undefined" indique à TypeScript la forme possible du résultat.
    // undefined signifie que SQLite n'a trouvé aucune ligne.
    const user = stmt.get(id_utilisateur) as User | undefined;

    // ?? est l'opérateur de fusion nulle.
    // Si user existe, on le retourne.
    // Si user vaut null ou undefined, on retourne null.
    return user ?? null;
}

// READ : cette fonction cherche un utilisateur par son email.
// Même logique que getUserById, mais avec la colonne email.
export function getUserByEmail(email: string): User | null {
    const stmt = db.prepare(`
        SELECT id_utilisateur, email, pseudo, mot_de_passe_hash, date_creation
        FROM UTILISATEUR
        WHERE email = ?
    `);

    const user = stmt.get(email) as User | undefined;

    return user ?? null;
}

// UPDATE : cette fonction modifie le pseudo d'un utilisateur.
// Elle retourne l'utilisateur mis à jour, ou null si aucun utilisateur n'a cet id.
export function updateUserPseudo(id_utilisateur: number, pseudo: string): User | null {
    // UPDATE indique la table à modifier.
    // SET indique la colonne à changer.
    // WHERE limite la modification à une ligne précise.
    const stmt = db.prepare(`
        UPDATE UTILISATEUR
        SET pseudo = ?
        WHERE id_utilisateur = ?
    `);

    // Les valeurs remplacent les ? dans l'ordre :
    // 1er ? = nouveau pseudo, 2e ? = id de l'utilisateur.
    const result = stmt.run(pseudo, id_utilisateur);

    // changes indique combien de lignes ont été modifiées.
    // Si changes vaut 0, aucun utilisateur avec cet id n'a été trouvé.
    if (result.changes === 0) {
        return null;
    }

    // Si la modification a réussi, on relit la ligne en base
    // pour retourner l'utilisateur complet et à jour.
    return getUserById(id_utilisateur);
}

// DELETE : cette fonction supprime un utilisateur.
// Ici, elle retourne true si la suppression réussit,
// et lance une erreur si l'utilisateur n'existe pas.
export function deleteUser(id_utilisateur: number): boolean {
    // DELETE FROM indique la table dans laquelle supprimer.
    // WHERE est indispensable : sans WHERE, on supprimerait toute la table.
    const stmt = db.prepare(`
        DELETE FROM UTILISATEUR
        WHERE id_utilisateur = ?
    `);

    const result = stmt.run(id_utilisateur);

    if (result.changes === 0) {
        throw new Error('Cet utilisateur n\'existe pas');
    }

    // Si on arrive ici, c'est que result.changes n'était pas égal à 0.
    // Donc une ligne a bien été supprimée.
    return true;
}