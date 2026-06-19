import {getDb} from "../db/db";
import {assertProprietaireCampagne} from "./campagneService";
import {getPersonnageByCampagneDal, insertPersonnageDal, Personnage, updatePersonnageDal} from "../dal/personnageDal";
import {string} from "zod";


const db = getDb();

export function createPersonnage(id_utilisateur: number,
                                 id_campagne: number,
                                 slug_pc: string,
                                 nom: string,
                                 description: string,
                                 fiche_json: string,): Personnage {
    const transaction = db.transaction((): Personnage => {
        assertProprietaireCampagne(id_campagne, id_utilisateur);

        return insertPersonnageDal(id_campagne, id_utilisateur, slug_pc, nom, description, fiche_json);
    });

    // On tente l'opération qui peut échouer.
    // SQLite LÈVE une exception si une contrainte est violée :
    // le try permet de l'intercepter au lieu de la laisser remonter brute jusqu'à la route.
    try {
        // L'insert vit dans la transaction -> c'est ICI que la violation UNIQUE peut surgir.
        return transaction();

        // catch attrape l'exception levée juste au-dessus.
        // "error: any" : TypeScript type l'erreur en "unknown" par défaut ; (MAuvais souvenirs !)
        // on force "any" pour pouvoir lire error.code (même convention que dans les routes).
    } catch (error: any) {

        // better-sqlite3 attache un CODE à ses erreurs.
        // 'SQLITE_CONSTRAINT_UNIQUE' = précisément une violation de contrainte UNIQUE.
        // On identifie ainsi LE cas connu (le doublon de personnage), sans confondre avec autre chose.
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {

            // On TRADUIT l'erreur technique de la base en message métier propre.
            // La route mappera ce message en 409 (conflit).
            throw new Error('Un personnage existe déjà pour cette campagne');
        }

        // Tout le reste (panne imprévue, ou erreurs du videur : 'Accès interdit' / 'Campagne introuvable')
        // est RELANCÉ intact. On ne masque jamais une erreur inattendue sous prétexte qu'on est dans un catch.
        throw error;
    }
}

export function getPersonnageByCampagne(id_campagne: number, id_utilisateur: number): Personnage | null {
    assertProprietaireCampagne(id_campagne, id_utilisateur);
    return getPersonnageByCampagneDal(id_campagne);
}

export function updatePersonnage(id_utilisateur: number, id_campagne: number, description: string, fiche_json: string): Personnage | null {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    const personnage = getPersonnageByCampagneDal(id_campagne);
    if (!personnage) {
        throw new Error('Personnage introuvable !'); // -> 404
    }
    return updatePersonnageDal(personnage.id_personnage, description, fiche_json);
}



