import { readFileSync } from 'fs';
import { join } from 'path';

// Le chemin vers mon fichier, ancré au dossier de CE fichier-ci.
const chemin = join(__dirname, 'init_regles.json');

export function chargerRegles() {
    const texte = readFileSync(chemin, 'utf-8'); // 1. je lis le fichier → une grande chaîne
    const regles = JSON.parse(texte);            // 2. je transforme la chaîne en objet JS
    return regles;                               // 3. je rends l'objet, prêt à l'emploi
}

