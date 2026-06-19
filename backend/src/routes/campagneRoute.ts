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
import { createNpc, getNpcsByCampagne } from "../services/npcService";
import {body, validationResult} from "express-validator";
import {createPersonnage, getPersonnageByCampagne, updatePersonnage} from "../services/personnageService";
import {handleValidationErrors} from "../middleware/handleValidationErrors";
import {validateFiche} from "../middleware/validateFiche";


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
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;
    // Express récupère notre :id dans l'emplacement, et on le stocke.
    try {
        res.status(200).json({ campagne: getCampagne(id, id_utilisateur)});
    } catch (error: any) {
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

// ----------------------------------------------- Routes de PERSONNAGE -----------------------------------------------

router.post('/:id/personnage', authMiddleware,
    [
        // Validation FORMAT (express-validator) — champs plats uniquement
        body('slug_pc').matches(/^pc_[a-z0-9]+(_[a-z0-9]+)*$/),
        body('nom').isLength({ min: 2, max: 100 }),
        body('description').isLength({ min: 1, max: 2000 }), // NOT NULL → requis (≠ NPC où c'était optionnel)
        // fiche_json : PAS ici — Zod s'en occupe plus bas
    ], handleValidationErrors, validateFiche,
    (req: Request, res: Response) => {
    

    // On rassemble les entrées depuis les 3 sources
        const id_campagne           = Number(req.params.id);            // URL
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

router.get('/:id/personnage', authMiddleware, (req: Request, res: Response) => {
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

router.patch('/:id/personnage', authMiddleware,
    [
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

// --- Sous-ressource NPC, imbriquée sous la campagne ---

router.post('/:id/npcs', authMiddleware,
    [
        body('id_organisation').isInt(),
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

router.get('/:id/npcs', authMiddleware, (req: Request, res: Response) => {
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