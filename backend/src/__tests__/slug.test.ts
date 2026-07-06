import { slugify, slugNpc } from '../utils/slug';

describe('slugify', () => {
    // test.each = une seule table de cas, un seul corps d'assertion.
    // Chaque ligne [entrée, attendu] devient un test à part entière.
    test.each([
        ['Rosalita',    'rosalita'],     // minuscules
        ['Chien Bleu',  'chien_bleu'],   // espace → underscore
        ['Zoé',         'zoe'],          // accents pliés
        ['Chien Bleu!', 'chien_bleu'],   // ponctuation avalée + trim final
        [' Rosalita ',  'rosalita'],     // trim des bouts
        ['ROSALITA',    'rosalita'],     // majuscules
    ])('slugify(%j) → %j', (entree, attendu) => {
        expect(slugify(entree)).toBe(attendu);
    });
});

describe('slugNpc', () => {
    test('préfixe le corps avec npc_', () => {
        expect(slugNpc('Chien Bleu')).toBe('npc_chien_bleu');
    });
});
