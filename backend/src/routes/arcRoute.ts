import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {body, param} from "express-validator";
import {handleValidationErrors} from "../middleware/handleValidationErrors";
import {createArc, getArcsByCampagne, terminerArc} from "../services/arcService";
import {ArcStatut} from "../dal/arcDAL";
import {createCheckpoint} from "../services/checkpointService";
import {MemoiresProposeesSchema} from "../schema/memoireSchema";

// ----------------------------------------------- Routes de ARC (+ CHECKPOINT) -----------------------------------------------
// Ce routeur est monté dans campagneRoute : router.use('/:id/arcs', arcRoute)
// → '/'                          correspond à /api/campagnes/:id/arcs
// → '/:id_arc/terminer'          correspond à /api/campagnes/:id/arcs/:id_arc/terminer
// → '/:id_arc/checkpoints'       correspond à /api/campagnes/:id/arcs/:id_arc/checkpoints
//
// CHECKPOINT vit ici car il est une sous-ressource de l'arc (pas de route sans :id_arc).
//
// mergeParams: true → le :id du parent (la campagne) reste lisible dans req.params.id,
// et cohabite avec le :id_arc déclaré localement.
const router = Router({ mergeParams: true });

router.post('/', authMiddleware,
    [
        // Je valide l'id d'URL en entier avant le handler : req.params est du texte, je refuse un id non-numérique (NaN) avant qu'il atteigne le service et la base.
        param('id').isInt(),
        body('titre').isLength({ min: 3, max: 100 }),
        body('resume').isLength({ min: 1, max: 2000 }),   // le "Ton:.. Objectif:.. Contexte:.." → requis
    ], handleValidationErrors,
    (req: Request, res: Response) => {
        const id_campagne    = Number(req.params.id);
        const id_utilisateur = req.user!.id_utilisateur;
        const { titre, resume } = req.body;

        try {
            const arc = createArc(id_utilisateur, id_campagne, titre, resume);
            res.status(201).json({ arc });
        } catch (error: any) {
            if (error.message === 'Accès interdit')      return res.status(403).json({ message: error.message });
            if (error.message === 'Campagne introuvable') return res.status(404).json({ message: error.message });
            return res.status(400).json({ message: error.message });
        }
    });

router.get('/', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;
    const statut         = req.query.statut as ArcStatut | undefined;   // <-- query, pas body

    try {
        const arcs = getArcsByCampagne(id_campagne, id_utilisateur, statut);
        res.status(200).json({ arcs });
    } catch (error: any) {
        if (error.message === 'Accès interdit')      return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable') return res.status(404).json({ message: error.message });
        return res.status(500).json({ message: error.message });
    }
});

router.patch('/:id_arc/terminer', authMiddleware,
    [param('id').isInt(), param('id_arc').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);       // param hérité du parent (mergeParams)
    const id_arc         = Number(req.params.id_arc);   // param local
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const arc = terminerArc(id_utilisateur, id_campagne, id_arc);
        res.status(200).json({ arc });
    } catch (error: any) {
        if (error.message === 'Accès interdit')                          return res.status(403).json({ message: error.message });
        if (error.message === 'Arc introuvable')                         return res.status(404).json({ message: error.message });
        if (error.message === 'Seul un arc en cours peut être clôturé')  return res.status(409).json({ message: error.message });
        return res.status(400).json({ message: error.message });
    }
});

// ----------------------------------------------- Routes de CHECKPOINT -----------------------------------------------

router.post('/:id_arc/checkpoints', authMiddleware,
    [
        param('id').isInt(), param('id_arc').isInt(),
        body('titre').isLength({ min: 3, max: 100 }),
        body('contenu').isLength({ min: 1, max: 10000 }),   // narratif → généreux, ajuste à ton goût
        body('resume').isLength({ min: 1 }).isLength({ max: 2000 }),
    ], handleValidationErrors, (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);
    const id_arc     = Number(req.params.id_arc);
    const id_utilisateur = req.user!.id_utilisateur;
    const { titre, contenu, resume } = req.body;

        const parsed = MemoiresProposeesSchema.safeParse(req.body.memoires ?? []);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.issues });
        }
        const memoires = parsed.data;   // le tableau validé, prêt à passer au service

    try {
        const result = createCheckpoint({id_utilisateur, id_campagne, id_arc, titre, contenu, resume, memoires});
        res.status(201).json(result);           //result = { checkpoint; memoires } → envoyé tel quel
    } catch (error: any) {
        if (error.message === 'Accès interdit')                          return res.status(403).json({ message: error.message });
        if (error.message === 'Arc introuvable')                         return res.status(404).json({ message: error.message });
        if (error.message === 'Campagne introuvable')                    return res.status(404).json({ message: error.message });
        if (error.message === 'NPC introuvable')                         return res.status(404).json({ message: error.message });
        return res.status(400).json({ message: error.message });
    }

});

export default router;
