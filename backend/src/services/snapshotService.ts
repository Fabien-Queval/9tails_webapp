import { assertProprietaireCampagne } from "./campagneService";
import { getArcsByCampagneDal } from "../dal/arcDAL";
import { getCheckpointsByCampagneDal } from "../dal/checkpointDAL";
import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "path";
import {readFileSync} from "fs";  // ← accorde au nom que tu gardes

export function generateSnapshot(id_campagne: number, id_utilisateur: number) {
    // Garde IDOR : je refuse un intrus AVANT toute lecture.
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    // Deux lectures : les arcs (pour titre + plot), et TOUS les checkpoints (à plat, déjà rangés).
    const arcs        = getArcsByCampagneDal(id_campagne);
    const checkpoints = getCheckpointsByCampagneDal(id_campagne);

    // J'assemble le sac : chaque arc reçoit SES checkpoints.
    const arcsAvecCheckpoints = arcs.map(arc => ({
        titre: arc.titre,
        plot:  arc.resume,
        checkpoints: checkpoints
            .filter(cp => cp.id_arc === arc.id_arc)              // je ne garde que les CP de CET arc
            .map(cp => ({ titre: cp.titre, contenu: cp.contenu })),
    }));

    const snapshot = {
        genere_le: new Date().toISOString(),
        arcs:      arcsAvecCheckpoints,
    };

    // Le dossier des snapshots, à côté de la base (backend/data)
    // C'est une route GPS : dirname (D'où on part, donc ici, dans ce fichier.
    // ".." = cd.., on remonte ici de deux dossier parents. Puis on va dans data, et dans snapshote !
    const dossierSnapshots = join(__dirname, "..", "..", "data", "snapshots");

    // writeFileSync ne crée pas les dossiers manquants → je m'assure que le dossier existe !
    // C'est pour créer au besoin, si il est pas présent. Recursive → Pour générer au cas où les dossiers parents.
    mkdirSync(dossierSnapshots, { recursive: true });

    // Le chemin du fichier de CETTE campagne
    const chemin = join(dossierSnapshots, `campagne_${id_campagne}.json`);

    // KJe transforme l'objet en texte JSON (le miroir de JSON.parse !!!), indenté pour la lisibilité :
    // null et 2 : Indenter avec 2 espaces !
    const texte = JSON.stringify(snapshot, null, 2);

    // J'écris (le miroir de readFileSync)
    writeFileSync(chemin, texte, "utf-8");

    return snapshot;   // l'écriture dans le fichier JSON = le bloc d'APRÈS, on ne l'empile pas ici
}

export function readSnapshot(id_campagne: number) {
    const chemin = join(__dirname, "..", "..", "data", "snapshots", `campagne_${id_campagne}.json`);
    const texte  = readFileSync(chemin, "utf-8");
    return JSON.parse(texte);
}