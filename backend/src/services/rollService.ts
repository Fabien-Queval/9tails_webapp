
export interface RollResult {
    test: string
    difficulte: number
    desResultat: number[]
    success: number
    marge: number
    resultat: 'success' | 'fail_forward'
}


export function lancerDes(pool: number): number[] {                 // 1 seul paramètre, le nombre de dés à lancer
    const resultats: number[] = []                                  // Tableau vide préparé pour accueillir les résultats
    for (let i = 0; i < pool; i++) {                    // Boucle qui tourne pool x
        resultats.push(Math.floor(Math.random() * 6) + 1);      // Génère entre ((0 et 09999..)*6)+1 et Math.floor tronque la décimale.
    }                                                           // En gros : Génère un chiffre entre 0 et 5 et ajoute 1. push.resultats met en tableau
    return resultats                                            // En fin de boucle restitue par ex: [6, 3, 1, 5, 2].
}

export function compterResultat(desResultat: number[], difficulte: number): Omit<RollResult, 'test'> {      // Utilitaire TypeScript. Il prend un type et retire une propriété. Pratique.
    const reussitesBrutes = desResultat.filter(d => d >= 5).length                          // Garde uniquement les dés ≥5 (5 ou 6), .length compte combien il y en a
    const annulations     = desResultat.filter(d => d === 1).length                         // Garde uniquement les dés ===1, .length compte combien il y en a
    const reussitesNettes = Math.max(0, reussitesBrutes - annulations)                      // Soustrait les annulations aux réussites brutes, mais jamais sous 0

    const marge    = reussitesNettes - difficulte                                                   // Écart entre ce qu'on a obtenu et ce qu'il fallait obtenir
    const resultat = marge >= 0 ? 'success' : 'fail_forward'                            // Si marge ≥0 → on a atteint ou dépassé la difficulté → success

    return { desResultat, success: reussitesNettes, marge, resultat, difficulte }                                       // Renvoie tout sauf "test" (exclu par Omit<RollResult, 'test'>)
}

export function roll(test: string, pool: number, difficulte: number): RollResult {              //
    const desResultat = lancerDes(pool)                                                // On appelle lancerDes avec le pool reçu en paramètre.
    const resultatCompte = compterResultat(desResultat, difficulte)         // on passe le tableau de dés obtenu, plus la difficulté reçue à la fonction.

    return { test, ...resultatCompte }                                                          //On recompose le jet, en placant le test devant. puis on décompose resultatCompte
}