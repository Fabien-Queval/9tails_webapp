import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getNpcById, updateNpc, deleteNpc } from '../services/npcService';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
    const id_npc = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const npc = getNpcById(id_npc, id_utilisateur);
        res.status(200).json({ npc });
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'NPC introuvable' || error.message === 'Campagne introuvable') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message });
    }
});

router.patch('/:id', authMiddleware,
    [
        body('id_organisation').isInt(),
        body('nom').isLength({ min: 2, max: 100 }),
        body('description').optional().isLength({ max: 2000 }),
        body('fiche_json').notEmpty(),
        body('statut').isIn(['ACTIF', 'INACTIF', 'MORT']),
        body('relation_pc').isInt({ min: -100, max: 100 })
    ],
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const id_npc = Number(req.params.id);
        const id_utilisateur = req.user!.id_utilisateur;
        const { id_organisation, nom, description, fiche_json, statut, relation_pc } = req.body;

        // Même règle que pour la création : fiche_json est du TEXT en base.
        const ficheJsonString = typeof fiche_json === 'string' ? fiche_json : JSON.stringify(fiche_json);

        try {
            const npcMisAJour = updateNpc(id_utilisateur, id_npc, id_organisation, nom, description ?? null, ficheJsonString, statut, relation_pc);
            res.status(200).json({ npcMisAJour });
        } catch (error: any) {
            if (error.message === 'Accès interdit') {
                return res.status(403).json({ message: error.message });
            }
            if (error.message === 'NPC introuvable' || error.message === 'Campagne introuvable') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(400).json({ message: error.message });
        }
    });

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
    const id_npc = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        deleteNpc(id_npc, id_utilisateur);
        res.status(200).json({ message: 'NPC supprimé' });
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'NPC introuvable' || error.message === 'Campagne introuvable') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message });
    }
});

export default router;
