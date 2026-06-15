// =============================================================================
// campagneService.ts — Service de création de campagne
// =============================================================================
// Rôle : orchestrer la logique métier.
// =============================================================================

import { getDb } from '../db/db';
import {
    insertCampagne,
    insertOrganisationSentinelle,
    insertJournal,
    Campagne, getCampagneById
} from '../dal/campagneDAL';

const db = getDb();

// -----------------------------------------------------------------------------
// createCampagne
// -----------------------------------------------------------------------------
// Crée une campagne complète : la campagne elle-même + son organisation
// sentinelle (org_aucune) + son journal vide.
//
// Les trois insertions sont enveloppées dans une transaction SQLite :
// si l'une plante, les deux autres sont annulées automatiquement (rollback).
// Résultat : jamais de campagne orpheline en base.
// -----------------------------------------------------------------------------
export function createCampagne(
    id_utilisateur: number,
    titre: string,
    genre: string,
    description: string | null,
    maturite: number
): Campagne {

    // db.transaction() reçoit une fonction et retourne une nouvelle fonction.
    // Cette nouvelle fonction, quand on l'appelle, exécute tout le bloc
    // de manière atomique (tout réussit ou rien n'est gardé).
    const transaction = db.transaction((): Campagne => {

        // Étape 1 — Créer la campagne en base.
        // On récupère l'objet complet (avec son id_campagne généré par SQLite).
        const campagne = insertCampagne(id_utilisateur, titre, genre, description, maturite);

        // Étape 2 — Créer l'organisation sentinelle.
        // Les NPCs sans affiliation auront toujours une FK valide vers cette org.
        insertOrganisationSentinelle(campagne.id_campagne);

        // Étape 3 — Créer le journal vide lié à la campagne.
        // Le joueur le remplira via ENTREE_JOURNAL au fil de la partie.
        insertJournal(campagne.id_campagne, titre);

        // On retourne la campagne — c'est ce que la route renverra au client.
        return campagne;
    });

    // On exécute la transaction et on retourne son résultat.
    return transaction();
}

// Création d'un helper : Cette petite fonction a pour but de vérifier que la campagne
// Appartient bien ç l'utilisateur. Sinon, erreur !

function assertProprietaireCampagne(id_campagne: number, id_utilisateur: number): Campagne {
    const campagne = getCampagneById(id_campagne);

    if (!campagne) {
        throw new Error('Campagne introuvable'); // → 404 dans la route
    }
    if (campagne.id_utilisateur !== id_utilisateur) {
        throw new Error('Accès interdit'); // → 403 dans la route
    }

    return campagne;
}
