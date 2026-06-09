// Importe la fonction getDb depuis mon module d'accès à la base.
// getDb() ouvre SQLite si nécessaire, applique le schéma, puis retourne l'instance de BDD.
import { getDb } from './db/db';

// Récupère l'instance SQLite.
// À ce moment-là, getDb() initialise la base si elle ne l'était pas encore.
const db = getDb();

// Récupère la liste des tables utilisateur présentes dans la base SQLite.
const tables = db

    // Prépare une requête SQL.
    // sqlite_master est une table système de SQLite qui décrit la structure de la base :
    // tables, index, vues, triggers, etc.
    .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `)

    // Exécute la requête et récupère toutes les lignes du résultat.
    // Chaque ligne aura ici la forme : { name: 'NOM_DE_TABLE' }
    .all() as { name: string }[];

// Affiche dans la console le nombre de tables trouvées.
// Le \n ajoute une ligne vide avant le message pour rendre l'affichage plus lisible.
console.log(`\n✅ ${tables.length} tables trouvées :`);

// Parcourt toutes les tables trouvées.
// Pour chaque table, affiche son nom dans la console.
tables.forEach(t => console.log(`  - ${t.name}`));

// Vérifie que le nombre de tables trouvées correspond au nombre attendu.
// Ici, ton schéma est censé créer exactement 14 tables métier.
if (tables.length !== 14) {

    // Affiche une erreur si le nombre de tables n'est pas celui attendu.
    // console.error sert à écrire dans la sortie d'erreur plutôt que dans la sortie normale.
    console.error(`\n❌ Attendu 14, obtenu ${tables.length}`);

    // Arrête le script avec un code d'erreur.
    // Le code 1 signifie : échec.
    // C'est utile pour signaler automatiquement qu'un test ou une vérification a échoué.
    process.exit(1);
}

// Si le script arrive jusqu'ici, c'est que la BDD contient bien 14 tables.
// On affiche donc un message de succès.
console.log('\n🎉 BDD vivante — Sprint 0 validé !');