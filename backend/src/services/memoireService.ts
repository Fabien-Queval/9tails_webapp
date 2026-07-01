// memoireService.ts
// Logique métier des mémoires.
// Pour l'instant je n'écris que l'assembleur de slug (une fonction PURE).
// La pose en base en lot (applyMem) viendra APRÈS le checkpoint : je la laisse en
// esquisse commentée tout en bas, pour me souvenir où ça va.


import { insertMemoireDal, Memoire } from '../dal/memoireDAL';
import { getNpcBySlugDal } from '../dal/npcDAL';
import { MemoireProposee } from '../schema/memoireSchema';

/**
 * Je construis le slug d'une mémoire à partir de ses morceaux.
 * Fonction PURE : je reçois des valeurs, je rends une chaîne, je ne touche à rien d'autre
 * (pas de base, pas d'horloge) -> donc testable toute seule.
 *
 * Forme visée :  mem_npc_<npc>_x_<cible>_<nature>_cpNNN
 * Exemple      :  mem_npc_rosalita_x_pc_fabien_confiance_gagnee_cp001
 */
export function construireSlugMemoire(
    npcKey: string,           // le NPC, déjà NU (sans son préfixe "npc_")  -> ex. "rosalita"
    nature: string,           // le tag venu du LLM, supposé déjà propre    -> ex. "confiance_gagnee"
    ordreCheckpoint: number,  // l'ordre du checkpoint courant               -> deviendra "cp001"
    cibleSlug: string | null  // la cible AVEC son préfixe ("pc_fabien"), ou null si pas de cible
): string {
    // Je formate le numéro de checkpoint sur 3 chiffres (1 -> "001"),
    // puis je colle "cp" devant. padStart est une méthode de String, d'où le String(...).
    const cpFormate = `cp${String(ordreCheckpoint).padStart(3, "0")}`;

    // Je prépare le morceau cible : il n'existe QUE si une cible m'a été donnée.
    // Je colle le "x_" À la cible pour qu'ils apparaissent — ou disparaissent — ENSEMBLE.
    // Si pas de cible, ce morceau vaut null (il sera jeté juste après).
    const morceauCible = cibleSlug ? `x_${cibleSlug}` : null;

    // Je range tous les morceaux dans l'ordre exact du slug.
    const morceaux = ["mem_npc", npcKey, morceauCible, nature, cpFormate];

    // filter(Boolean) jette les morceaux "vides" (ici le null de la cible absente).
    // join("_") recolle ce qui reste avec des underscores -> mon slug final.
    return morceaux.filter(Boolean).join("_");
}

/**
 * Je pose en base, EN LOT, les N mémoires nées d'un checkpoint.
 * Je ne crée PAS de transaction ici : Je suis appelé à l'intérieur de la
 * TRANSACTION qui crée le checkpoint (c'est lui qui tient le "tout ou rien")
 */


export function applyMem(
    id_campagne: number,
    id_checkpoint: number,
    ordre: number,
    memoires: MemoireProposee[]
): Memoire[] {
    // map : pour chaque mémoire proposée, je renvoie la ligne créée → j'obtiens un Memoire[]
    return memoires.map((m) => {
    // 1. Je résous le NPC porteur, SCOPE à la campagne (= mon IDOR)
    //  Absent ici ? Je refuse : le LLM a pu inventer des conneries
    const npc = getNpcBySlugDal(id_campagne, m.npc);
    if(!npc) {
        throw new Error('NPC introuvable'); // → 404 côté route
    }

    // 2. Je prends le nom NU depuis le NPC trouvé en base (la vérité, pas la châîne du LLM)
    //  construireSlugMemoire préfixe déjà "mem_npc_", donc j'enlève un "npc_" éventuel.
    const npcKey = npc.slug.replace(/^npc_/, '');

    // 3. J'assemble le slug, garanti conforme au CHECK de la base.
    const slug = construireSlugMemoire(npcKey, m.nature, ordre, m.cible_slug);

    // 4. J'insère (ordre des args = signature du DAL).

    return insertMemoireDal(
        npc.id_npc,
        id_checkpoint,
        slug,
        m.contenu,
        m.cible_type,
        m.cible_slug,
    );

});
}
