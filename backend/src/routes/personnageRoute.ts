import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {body, param} from "express-validator";
import {handleValidationErrors} from "../middleware/handleValidationErrors";
import {validateFiche} from "../middleware/validateFiche";
import {createPersonnage, getPersonnageByCampagne, updatePersonnage} from "../services/personnageService";

// ----------------------------------------------- Routes de PERSONNAGE -----------------------------------------------
// Ce routeur est monté dans campagneRoute : router.use('/:id/personnage', personnageRoute)
// → les chemins ici sont donc RELATIFS : '/' correspond à /api/campagnes/:id/personnage
//
// mergeParams: true = « hérite des params du parent ». Sans lui, chaque Router ne voit
// que SES propres segments d'URL : le :id déclaré dans campagneRoute serait invisible
// ici, et req.params.id vaudrait undefined.
const router = Router({ mergeParams: true });

router.post('/', authMiddleware,
    [
        // Je valide l'id d'URL en entier avant le handler : req.params est du texte, je refuse un id non-numérique (NaN) avant qu'il atteigne le service et la base.
        param('id').isInt(),
        // Validation FORMAT (express-validator) — champs plats uniquement
        body('slug_pc').matches(/^pc_[a-z0-9]+(_[a-z0-9]+)*$/),
        body('nom').isLength({ min: 2, max: 100 }),
        body('description').isLength({ min: 1, max: 2000 }), // NOT NULL → requis (≠ NPC où c'était optionnel)
        // fiche_json : PAS ici — Zod s'en occupe plus bas
    ], handleValidationErrors, validateFiche,
    (req: Request, res: Response) => {


    // On rassemble les entrées depuis les 3 sources
        const id_campagne           = Number(req.params.id);            // URL (param hérité via mergeParams)
        const id_utilisateur        = req.user!.id_utilisateur;         // jeton
        const { slug_pc, nom, description } = req.body;                         // corps
        const fiche_json             = JSON.stringify(req.ficheValidee); // fiche validée par le middleware → chaîne TEXT

    // Et finalement, on appelle le service, et on attrape les erreurs pour les traduire en codes HTTP
        try {
            const personnage = createPersonnage(
                id_utilisateur, id_campagne, slug_pc, nom, description, fiche_json
            );
            res.status(201).json({ personnage }); // 201 = créé
        } catch (error: any) {
            if (error.message === 'Accès interdit')
                return res.status(403).json({ message: error.message });
            if (error.message === 'Campagne introuvable')
                return res.status(404).json({ message: error.message });
            if (error.message === 'Un personnage existe déjà pour cette campagne')
                return res.status(409).json({ message: error.message });
            return res.status(400).json({ message: error.message });
        }
});

router.get('/', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);   // URL
    const id_utilisateur = req.user!.id_utilisateur; // jeton

    try {
        const personnage = getPersonnageByCampagne(id_campagne, id_utilisateur);

        // Le service peut renvoyer null : campagne à toi, mais pas (encore) de PC
        if (!personnage) {
            return res.status(404).json({ message: 'Personnage introuvable' });
        }

        res.status(200).json({ personnage });
    } catch (error: any) {
        if (error.message === 'Accès interdit')
            return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable')
            return res.status(404).json({ message: error.message });
        return res.status(500).json({ message: error.message });
    }
});

router.patch('/', authMiddleware,
    [
        param('id').isInt(),
        body('description').isLength({ min: 1, max: 2000 }),
    ], handleValidationErrors, validateFiche,
    (req: Request, res: Response) => {

    const id_campagne    = Number(req.params.id);               // URL
    const id_utilisateur = req.user!.id_utilisateur;            // jeton
    const description       = req.body.description;                             // corps
    const fiche_json       = JSON.stringify(req.ficheValidee);  // fiche validée par le middleware → chaîne TEXT

    try {
        const personnageUpdated = updatePersonnage(id_utilisateur, id_campagne, description, fiche_json);

        res.status(200).json({personnageUpdated});
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Personnage introuvable') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
    }
});

export default router;
