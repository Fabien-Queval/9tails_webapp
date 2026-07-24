import {Router, Request, Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    activerCampagne,
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
import { jouerTour, lancerJet } from "../services/jeuService";
import { lireFilRecent } from "../services/messageService";
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
    // Je valide l'id d'URL en entier avant le handler : req.params est du texte, je refuse un id non-numérique (NaN) avant qu'il atteigne le service et la base.
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
router.patch('/:id', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
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
router.patch('/:id/archiver', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
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
router.patch('/:id/restaurer', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
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

// ROUTE de activerCampagne
router.patch('/:id/activer', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        const campagneActivee = activerCampagne(id, id_utilisateur);
        res.status(200).json({campagneActivee});
    } catch (error: any) {
        if (error.message === 'Accès interdit') {
            return res.status(403).json({message: error.message});
        }
        if (error.message === 'Campagne introuvable') {
            return res.status(404).json({message: error.message});
        }
        // Nouvelle erreur : 409 = CONFLIT !
        if (error.message === 'Seule une campagne en brouillon peut être activée') {
            return res.status(409).json({message: error.message});
        }
        return res.status(500).json({message: error.message});
    }
})

// ROUTE de deleteCampagne()
router.delete('/:id', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
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
    param('id').isInt(),
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

// ----------------------------------------------- Route JOUER (narration LLM) -----------------------------------------------
// Comme proposer-memoires : c'est une action au niveau de la campagne (appel LLM), elle reste ici.
router.post('/:id/jouer', authMiddleware,
    [
        param('id').isInt(),
        body('actionJoueur').isString().isLength({ min: 1, max: 10000 }),
    ],
    handleValidationErrors, async (req: Request, res: Response) => {
    // { actionJoueur } = req.body : je déballe req.body et je vais y chercher SON champ actionJoueur,
    // pour le poser dans une const du même nom.  (identique à : const actionJoueur = req.body.actionJoueur)
    const { actionJoueur } = req.body;
    const id_campagne    = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        // jouerTour me rend { recit, jet_propose } ; je renvoie l'objet tel quel au front.
        const reponseMaia = await jouerTour(id_utilisateur, id_campagne, actionJoueur);
        res.status(200).json(reponseMaia);
    } catch (error: any) {
        if (error.message === 'Accès interdit')       return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable') return res.status(404).json({ message: error.message });

        return res.status(502).json({ message: 'Le conteur est indisponible, réessaie.' });
    }
});

// ----------------------------------------------- Route JET (dé contextualisé) -----------------------------------------------
// Le front envoie { caracteristique, difficulte } ; le backend lit la fiche, calcule le pool, lance le dé.
router.post('/:id/jet', authMiddleware,
    [
        param('id').isInt(),
        body('caracteristique').isIn(['CORPS', 'SENS', 'ESPRIT', 'SOCIAL']),
        body('difficulte').isInt({ min: 1, max: 9 }).toInt(),
    ],
    handleValidationErrors,
    (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;
    const { caracteristique, difficulte } = req.body;

    try {
        const resultat = lancerJet(id_utilisateur, id_campagne, caracteristique, difficulte);
        res.status(200).json(resultat);
    } catch (error: any) {
        if (error.message === 'Accès interdit')         return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable')   return res.status(404).json({ message: error.message });
        if (error.message === 'Personnage introuvable') return res.status(404).json({ message: error.message });
        return res.status(500).json({ message: error.message });
    }
});

// Ma limite d'affichage à l'écran : les 50 derniers messages.
// Volontairement DISTINCTE de NB_MESSAGES_FENETRE (le budget de tokens du LLM, dans jeuService) :
// ici c'est un confort de LECTURE, pas un budget — les deux nombres ne doivent pas se coupler.
const LIMITE_FIL_ECRAN = 50;

// ----------------------------------------------- Route LIRE LE FIL (rechargement écran) -----------------------------------------------
// GET : pas d'appel LLM, pas de body. Je rends les derniers messages de la partie pour que
// l'écran de jeu se remplisse au chargement au lieu de repartir vide (les messages sont déjà en base).
// Je borne à LIMITE_FIL_ECRAN : un fil très long alourdirait le navigateur. Charger les plus
// anciens au scroll = amélioration futur/P2, hors périmètre V0.
router.get('/:id/messages', authMiddleware,
    [param('id').isInt()], handleValidationErrors,
    (req: Request, res: Response) => {
    const id_campagne    = Number(req.params.id);
    const id_utilisateur = req.user!.id_utilisateur;

    try {
        // lireFilRecent vérifie d'abord que la campagne m'appartient (IDOR), puis rend les N derniers (chronologiques).
        // Même fonction que celle qui nourrit Maïa, mais appelée avec MA limite d'écran, pas la sienne.
        const messages = lireFilRecent(id_utilisateur, id_campagne, LIMITE_FIL_ECRAN);
        res.status(200).json({ messages });
    } catch (error: any) {
        if (error.message === 'Accès interdit')       return res.status(403).json({ message: error.message });
        if (error.message === 'Campagne introuvable') return res.status(404).json({ message: error.message });
        return res.status(500).json({ message: error.message });
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
