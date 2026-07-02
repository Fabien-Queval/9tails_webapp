// poc-llm.ts — script JETABLE pour prouver l'appel LLM (à supprimer après le PoC).
// Il ne touche PAS à la base : un appel, un JSON validé, on regarde le résultat.
//
// Lancer depuis backend/ :   npx ts-node src/poc-llm.ts

import 'dotenv/config';                          // charge ANTHROPIC_API_KEY AVANT tout le reste
import { proposerMemoires } from './services/llmService';

const sceneTest = `Rosalita, une marchande PNJ, a vu le héros (pc_fabien) la sauver
d'une embuscade. Elle lui en est désormais reconnaissante et lui fait confiance.`;

proposerMemoires(sceneTest)
    .then((memoires) => {
        console.log('\n✅ Mémoires proposées :');
        console.dir(memoires, { depth: null });
    })
    .catch((err) => console.error('\n❌', err.message));
