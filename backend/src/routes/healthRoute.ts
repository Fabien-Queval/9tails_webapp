import { Router, Request, Response } from "express";

// D'abord, je crée mon instance de Router
const router = Router();

// Ensuite, je vais enregistrer une route GET
router.get('/health', (req: Request, res: Response) => {

    // ce qu'on fait quand quelqu'un appelle GET /health
    res.json({ status : 'Je suis vivant !', timestamp: new Date().toISOString() });
});

export default router;