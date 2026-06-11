declare global {
    namespace Express {
        interface Request {
            user?: { id_utilisateur: number; email: string };
        }
    }
}

import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("Authorization") as string;

    // Le if vérifie deux choses avec un || OU
    // Si le header est inexistant (Parce que authorization sera undefined
    // si le client n'a pas envoyé ce header.)
    // OU logique => Si l'autre condition est vraie aussi.
    // startsWith => méthode native sur les string.
    if (!authorization || !authorization.startsWith("Bearer ")) {
        res.status(401).json({ message: "Clé manquante ou invalide"});
        return;
    }

    //Donne un tableau ou le token est à l'index 1 !
    const token = authorization.split(" ")[1];

    // Le JSON Web Token : Chaîne signée que le serveur génère et que le
    // client garde en mémoire ou localStorage côté front !
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "Token invalide !" });
        } else {
            req.user = decoded as {id_utilisateur: number; email: string};
            next()
        }
    })
}

