import { compterResultat } from '../services/rollService';

//describe(...) est un simple regroupement. Il sert à étiqueter un paquet de tests qui parlent tous de la m^peme fonction
describe('compterResultat', () => {

    // Voici le test 1. La string décrit ce qu'on vérifie
    it('compte les dés ≥5 comme des réussites', () => {

        //On fait notre tableau sans aléa pour avoir un résultat prévisble (expected)
        const resultat = compterResultat([5, 6, 2, 3], 1);
        expect(resultat.success).toBe(2);
    });


it('un dé de valeur 1 annule une réussite', () => {
    const resultat = compterResultat([1, 5, 6, 2], 1);
    expect(resultat.success).toBe(1);
});

it('les annulations ne peuvent jamais faire descendre success sous 0', () => {
    const resultat = compterResultat([1, 1, 1, 2, 3], 0);
    expect(resultat.success).toBe(0);
});

it('marge positive ou nulle donne success comme résultat', () => {
    const resultat = compterResultat([5, 6, 5], 2);
    expect(resultat.marge).toBe(1);
    expect(resultat.resultat).toBe('success');
});

it('marge négative donne fail_forward comme résultat', () => {
    const resultat = compterResultat([5, 2, 3], 2);
    expect(resultat.marge).toBe(-1);
    expect(resultat.resultat).toBe('fail_forward');
});
});