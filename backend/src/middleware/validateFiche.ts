// middleware/validateFiche.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FichePcSchema } from '../schema/ficheSchema';

// On augmente le type Request d'Express pour y ranger la fiche validée,
// exactement comme authMiddleware ajoute req.user.
type FicheValidee = z.infer<typeof FichePcSchema>;

declare global {
    namespace Express {
        interface Request {
            ficheValidee?: FicheValidee;
        }
    }
}

// Valide la FORME de fiche_json avec Zod.
// Soit elle bloque (400 + détail des erreurs), soit elle range la fiche
// validée dans req.ficheValidee et laisse passer (next).
export function validateFiche(req: Request, res: Response, next: NextFunction) {
    const result = FichePcSchema.safeParse(req.body.fiche_json);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }
    req.ficheValidee = result.data;   // la fiche validée, prête pour le handler
    next();
}
