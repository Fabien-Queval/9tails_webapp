// 1. IMPORTS
import dotenv from 'dotenv';
dotenv.config();
import { getDb } from './db/db';
import express from 'express';
import healthRoute from "./routes/healthRoute";
import authRoute from "./routes/authRoute";
import campagneRoute from "./routes/campagneRoute";
import npcRoute from "./routes/npcRoute";
import cors from 'cors';
import rollRoute from "./routes/rollRoute";

// 2. INITIALISATION EXPRESS
const app = express();
app.use(cors({
    origin: 'http://localhost:4200'  // seul Angular peut parler à l'API
}));

app.use(express.json());


// 3. INITIALISATION BDD
getDb();

// 4. BRANCHEMENT DES ROUTES
app.use('/api', healthRoute);
app.use('/api/auth', authRoute);
app.use('/api/campagnes', campagneRoute);
app.use('/api/npcs', npcRoute);
app.use('/api/roll', rollRoute);

// 5. DEMARRAGE DU SERVEUR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});