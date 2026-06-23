import {body, validationResult} from "express-validator";
import {roll} from "../services/rollService";
import { Router, Request, Response } from "express";

const router = Router();

router.post('/',
    [
        body('test').isLength({ min: 3, max: 20 }),
        body('pool').isInt({ min: 1, max: 20 }).toInt(),
        body('difficulte').isInt({ min: 1, max: 9 }).toInt(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({})
        }

    const { test, pool, difficulte } = req.body;

    try {
        const jetDes = roll(test, pool, difficulte);
        res.status(200).json(jetDes);
        } catch (error: any) {
        res.status(400).json({message: error.message});
    }
    });


export default router;