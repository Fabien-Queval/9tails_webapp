import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {createCampagne, getCampagne, getCampagnes} from "../services/campagneService";
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



// Le async ici ne sert pas vraiment, il n'est pas faux, cependant
// La faute à better-sqlite3 qui est en fait synchrone.
// Je préfère le laisser par habitude, en gardant ça en tête poour plus tard.
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    const id_utilisateur = req.user!.id_utilisateur;
    try {
        const campagnes = getCampagnes(id_utilisateur);
        res.status(200).json({campagnes});
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
})

// Ici, on va dire que l'emplacement n'a pas une valeur fixe
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;
    // Express récupère notre :id dans l'emplacement, et on le stocke.
    try {
        res.status(200).json({ campagne: getCampagne(id, id_utilisateur)});
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
})







export default router;