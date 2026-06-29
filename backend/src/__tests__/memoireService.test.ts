import { construireSlugMemoire } from '../services/memoireService';

// describe regroupe tous les tests qui parlent de la même fonction.
describe('construireSlugMemoire', () => {

    // Cas nominal : il y a une cible -> on vérifie le slug complet, bloc "x_<cible>" inclus.
    it('assemble un slug complet quand il y a une cible', () => {
        const slug = construireSlugMemoire('rosalita', 'confiance_gagnee', 1, 'pc_fabien');
        expect(slug).toBe('mem_npc_rosalita_x_pc_fabien_confiance_gagnee_cp001');
    });

    // Cas sans cible : le bloc "x_<cible>" doit disparaître ENTIÈREMENT (pas de "_x_" orphelin).
    it('omet le bloc cible quand cibleSlug est null', () => {
        const slug = construireSlugMemoire('rosalita', 'confiance_gagnee', 1, null);
        expect(slug).toBe('mem_npc_rosalita_confiance_gagnee_cp001');
    });

    // Le numéro de checkpoint est toujours rembourré sur 3 chiffres : 7 -> "cp007".
    it('rembourre le numéro de checkpoint sur 3 chiffres', () => {
        const slug = construireSlugMemoire('eldra_voss', 'secret_partage', 7, null);
        expect(slug).toBe('mem_npc_eldra_voss_secret_partage_cp007');
    });

    // padStart ne tronque jamais : un numéro déjà à 3 chiffres passe tel quel.
    it('ne tronque pas un numéro déjà à 3 chiffres', () => {
        const slug = construireSlugMemoire('dorian', 'trahison', 100, null);
        expect(slug).toBe('mem_npc_dorian_trahison_cp100');
    });

    // Filet de sécurité : quelle que soit l'entrée, le slug doit respecter le CHECK de la base.
    it('produit toujours un slug conforme au CHECK de la base', () => {
        const regexBase = /^mem_npc_[a-z0-9]+(_[a-z0-9]+)*_cp[0-9]{3}$/;
        expect(construireSlugMemoire('rosalita', 'confiance_gagnee', 1, 'pc_fabien')).toMatch(regexBase);
        expect(construireSlugMemoire('rosalita', 'confiance_gagnee', 1, null)).toMatch(regexBase);
    });
});
