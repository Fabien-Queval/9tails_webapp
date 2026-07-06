import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    archiverCampagne,
    createCampagne, deleteCampagne,
    getCampagne,
    getCampagnes,
    restaurerCampagne,
    updateCampagne
} from "../services/campagneService";
import {body, param, validationResult} from "express-validator";
import {handleValidationErrors} from "../middleware/handleValidationErrors";
import {proposerMemoiresPourScene} from "../services/memoireService";
import personnageRoute from "./personnageRoute";
import campagneNpcRoute from "./campagneNpcRoute";
import arcRoute from "./arcRoute";


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


// ROUTE DE getCampagnes()
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
// ROUTE de getCampagne()
router.get('/:id', authMiddleware,
    [param('id').isInt()],
    handleValidationErrors,
    async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;
    // Express récupère notre :id dans l'emplacement, et on le stocke.
    try {
        res.status(200).json({ campagne: getCampagne(id, id_utilisateur)});
    } catch (error: any) {
        // console.error('Échec LLM (proposer-memoires) :', error);   // ← temporaire, pour voir la vraie cause
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
})

// ROUTE de updateCampagne
router.patch('/:id', authMiddleware, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    const { titre, description, maturite } = req.body;
    try {
        const campagneMiseAJour = updateCampagne(id,
            id_utilisateur,
            titre,
            description,
            maturite
        );
        res.status(200).json({campagneMiseAJour});
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
});

// ROUTE de archiverCampagne()
router.patch('/:id/archiver', authMiddleware, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const campagneArchivee = archiverCampagne(id, id_utilisateur);
        res.status(200).json({campagneArchivee});
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        // Nouvelle erreur : 409 = CONFLIT !
        if (error.message === 'Seule une campagne active peut être archivée') {
            return res.status(409).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
});

// ROUTE de restaurerCampagne
router.patch('/:id/restaurer', authMiddleware, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const campagneRestauree = restaurerCampagne(id, id_utilisateur);
        res.status(200).json({campagneRestauree});

    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        // Nouvelle erreur : 409 = CONFLIT !
        if (error.message === 'Seule une campagne archivée peut être restaurée') {
            return res.status(409).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
});

// ROUTE de deleteCampagne()
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        deleteCampagne(id, id_utilisateur);
        res.status(200).json({message :'Campagne supprimée'});
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
});

// ----------------------------------------------- Routes de MEMOIREPROPOSEE -----------------------------------------------
// Reste ici (et pas dans un fichier enfant) : c'est une action au niveau de la
// campagne elle-même, pas une sous-ressource avec son propre cycle de vie.

router.post('/:id/proposer-memoires', authMiddleware,
    [
    body('contexteScene').isString().isLength({ min: 1, max: 10000}),
    ],
    handleValidationErrors, async (req: Request, res: Response)=> {
    const { contexteScene } = req.body;
    const id_campagne    = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const propositionMemoires = await proposerMemoiresPourScene(id_campagne, id_utilisateur, contexteScene);
        res.status(200).json({ propositionMemoires });
    } catch (error: any) {
        if (error.message === 'Accès interdit')                          return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable')                    return res.status(404).json({ message: error.message });

        return res.status(502).json({ message: 'Le conteur est indisponible, réessaie.' });
    }
    });

// ----------------------------------------------- Montage des sous-ressources -----------------------------------------------
// Chaque sous-ressource de la campagne vit dans son propre fichier de routes.
// Le début du chemin (avec le :id de la campagne) est déclaré ICI, une seule fois ;
// le fichier enfant ne connaît que la suite du chemin, et récupère le :id
// grâce à son option { mergeParams: true }.

router.use('/:id/personnage', personnageRoute);   // POST / GET / PATCH  /api/campagnes/:id/personnage
router.use('/:id/npcs', campagneNpcRoute);        // POST / GET          /api/campagnes/:id/npcs
router.use('/:id/arcs', arcRoute);                // arcs + terminer + checkpoints

export default router;
