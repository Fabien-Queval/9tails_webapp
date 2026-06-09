// Importe la librairie better-sqlite3.
// Elle permet d'utiliser SQLite depuis Node.js avec une API synchrone.
import Database from 'better-sqlite3';

// Importe le module natif path de Node.js.
// Il sert à construire des chemins de fichiers propres, compatibles Windows/Linux/Mac.
import path from 'path';

// Importe le module natif fs de Node.js.
// Il permet ici de lire le fichier schema.sql.
import fs from 'fs';

// Construit le chemin absolu vers le fichier de base de données SQLite.
// __dirname correspond au dossier du fichier db.ts une fois exécuté/compilé.
// ../../data/9tails.db remonte de deux dossiers puis va dans data.
const DB_PATH = path.join(__dirname, '../../data/9tails.db');

// Construit le chemin absolu vers le fichier contenant le schéma SQL.
// Ce fichier sera lu puis exécuté pour créer les tables si besoin.
const SCHEMA_PATH = path.join(__dirname, '../../db/schema.sql');

// Déclare une variable db qui contiendra l'instance de connexion SQLite.
// Le "!" dit à TypeScript : "je sais qu'elle sera initialisée avant utilisation".
let db!: Database.Database;

// Exporte une fonction getDb pour récupérer l'instance de base de données.
// Le reste de l'application appellera cette fonction au lieu de créer une connexion directement.
export function getDb(): Database.Database {

    // Si db n'existe pas encore, on l'initialise.
    // Cela permet d'avoir une seule connexion SQLite partagée dans l'application.
    if (!db) {

        // S'assure que le dossier /data existe avant d'ouvrir le fichier SQLite.
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

        // Ouvre la base SQLite située à DB_PATH.
        // Si le fichier n'existe pas encore, SQLite peut le créer automatiquement.
        db = new Database(DB_PATH);

        // Active la vérification des clés étrangères dans SQLite.
        // Important : sans ça, SQLite accepte les FOREIGN KEY dans le schéma,
        // mais ne les applique pas forcément.
        db.pragma('foreign_keys = ON');

        // Déclare une fonction SQL personnalisée appelée "regexp".
        // Elle permet d'utiliser REGEXP dans les requêtes ou contraintes SQL.
        db.function('regexp', (pattern: string, valueToTest: string): number => {

            // Crée une expression régulière JavaScript à partir du pattern reçu depuis SQLite.
            // Puis teste si la chaîne valueToTes correspond au pattern.
            // Retourne 1 si ça correspond, 0 sinon, car SQLite travaille avec des nombres pour vrai/faux.
            return new RegExp(pattern).test(valueToTest) ? 1 : 0;
        });

        // Lit le contenu du fichier schema.sql en texte UTF-8.
        // On récupère donc toutes les instructions SQL de création de tables, index, contraintes, etc.
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

        // Exécute le script SQL complet.
        // Typiquement : CREATE TABLE IF NOT EXISTS..., CREATE INDEX..., etc.
        db.exec(schema);
    }

    // Retourne l'instance SQLite.
    // Si elle existait déjà, on la réutilise.
    // Si elle n'existait pas, elle vient d'être créée juste au-dessus.
    return db;
}