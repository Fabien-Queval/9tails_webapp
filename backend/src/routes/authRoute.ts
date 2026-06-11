import { Router, Request, Response } from "express";
import {login, register} from "../services/authService";

// Crée un routeur Express indépendant pour les routes d'authentification
const router = Router();

// Inscription — hache le mot de passe et retourne un token JWT
router.post('/register', async (req: Request, res: Response) => {
    const { email, pseudo, password } = req.body;
    try {
        const token = await register(email, pseudo, password);
        res.json({ token });
    } catch (error: any) {
        // 400 : requête invalide (email déjà pris, données manquantes...)
        res.status(400).json({ message: error.message });
    }
})

// Connexion — vérifie les identifiants et retourne un token JWT
router.post('/login', async (req: Request, res: Response) => {
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