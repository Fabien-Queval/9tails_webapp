import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createCampagne } from "../services/campagneService";
import {body, validationResult} from "express-validator";

const router = Router();

router.post('/', authMiddleware,
    [
        body('titre').isLength({ min: 3, max: 50 }),
        body('genre').isLength({ min: 3, max: 50 }),
        body('description').optional().isLength({ max: 2000 }),
        body('maturite').isInt().isIn([12, 16, 18])
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }

    const { titre, genre, description, maturite } = req.body;

    // On fait venir id_utilisateur l'authMiddleware, c'est sécurisé
    // l'"user!" signifie qu'on assure à typescript qu'il est non nul.
    const id_utilisateur = req.user!.id_utilisateur;
    try {
        const campagne = createCampagne(id_utilisateur, titre, genre, description, maturite);
        res.status(201).json({campagne});
        } catch (error: any) {
        res.status(400).json({message: error.message});
    }
});

export default router;