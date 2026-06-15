import { Router, Request, Response } from "express";
import { login, register } from "../services/authService";
import { body, validationResult } from "express-validator";

// Crée un routeur Express indépendant pour les routes d'authentification
const router = Router();

// Inscription — hache le mot de passe et retourne un token JWT
router.post('/register',
    [
        body("email").isEmail().withMessage("Email invalide"),
        body("pseudo").isLength({ min: 3, max: 20 }).withMessage("Doit avoir entre 3 et 20 caractères"),
        body("password").isLength({ min: 8 }).withMessage("Doit avoir au minimum 8 caractères"),
    ]
    , async (req: Request, res: Response) => {
        const errors = validationResult(req);    // je lis les erreurs
            if (!errors.isEmpty()) {                 // s'il y en a...
                // Ici on met errors: erros au lieu de message, car il peut y avoir plusieurs champs erronés
                return res.status(400).json({ errors: errors.array() }); // ...je bloque
            }
        // Si on arrive ici, tout est propre, on appelle le service !
        const { email, pseudo, password } = req.body;
    try {
        const token = await register(email, pseudo, password);
        res.json({ token });
    } catch (error: any) {
        // 400 : requête invalide (email déjà pris, données manquantes...)
        res.status(400).json({message: error.message});
    }
})

// Connexion — vérifie les identifiants et retourne un token JWT
router.post('/login',
    [
        body("email").isEmail().withMessage("Email invalide"),
        body('password').isLength({ min: 8 }).withMessage("Doit avoir au minimum 8 caractères"),
    ],
    async (req: Request, res: Response) => {
    const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

    const { email, password } = req.body;
    try {
        const token = await login(email, password);
        res.json({ token });
    } catch (error: any) {
        // Message volontairement générique — ne pas révéler si c'est l'email ou le mot de passe qui est faux
        res.status(400).json({ message: error.message });
    }
})

export default router;