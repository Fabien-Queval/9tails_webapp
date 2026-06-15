import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createCampagne } from "../services/campagneService";

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
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