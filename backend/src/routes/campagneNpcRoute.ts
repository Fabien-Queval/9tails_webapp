import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {body, param, validationResult} from "express-validator";
import { createNpc, getNpcsByCampagne } from "../services/npcService";

// ----------------------------------------------- Routes NPC imbriquées sous CAMPAGNE -----------------------------------------------
// Ce routeur est monté dans campagneRoute : router.use('/:id/npcs', campagneNpcRoute)
// → '/' correspond à /api/campagnes/:id/npcs
//
// ⚠️ Ne pas confondre avec npcRoute.ts, qui gère l'accès PLAT /api/npcs/:id
// (lecture / modification / suppression d'un NPC par son propre id).
// Ici = les opérations « dans le contexte d'une campagne » : créer, lister.
//
// mergeParams: true → le :id du parent (la campagne) reste lisible dans req.params.id.
const router = Router({ mergeParams: true });

router.post('/', authMiddleware,
    [
        // Je valide l'id d'URL en entier avant le handler : req.params est du texte, je refuse un id non-numérique (NaN) avant qu'il atteigne le service et la base.
        param('id').isInt(),
        body('id_organisation').optional().isInt(), // si absent, ne râle pas ; s'il est là, qu'il soit un entier
        body('slug').matches(/^npc_[a-z0-9]+(_[a-z0-9]+)*$/),
        body('nom').isLength({ min: 2, max: 100 }),
        body('description').optional().isLength({ max: 2000 }),
        body('fiche_json').notEmpty()
    ],
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const id_campagne = Number(req.params.id);
        const id_utilisateur = req.user!.id_utilisateur;
        const { id_organisation, slug, nom, description, fiche_json } = req.body;

        // fiche_json est stocké en TEXT en base : si le client envoie un objet JSON,
        // on le sérialise en string avant de le transmettre au service.
        const ficheJsonString = typeof fiche_json === 'string' ? fiche_json : JSON.stringify(fiche_json);

        try {
            const npc = createNpc(id_utilisateur, id_campagne, id_organisation, slug, nom, description ?? null, ficheJsonString);
            res.status(201).json({ npc });
        } catch (error: any) {
            if (error.message === 'Accès interdit') {
                return res.status(403).json({ message: error.message });
            }
            if (error.message === 'Campagne introuvable') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(400).json({ message: error.message });
        }
    });

router.get('/', authMiddleware,
    [param('id').isInt()],
    (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const id_campagne = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const npcs = getNpcsByCampagne(id_campagne, id_utilisateur);
        res.status(200).json({ npcs });
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message });
    }
});

export default router;
