// memoireService.ts
// Logique métier des mémoires.
// Pour l'instant je n'écris que l'assembleur de slug (une fonction PURE).
// La pose en base en lot (applyMem) viendra APRÈS le checkpoint : je la laisse en
// esquisse commentée tout en bas, pour me souvenir où ça va.

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

/* ---------------------------------------------------------------------------
   ESQUISSE — applyMem  (À FINALISER APRÈS checkpointDAL/Service)
   Je la laisse en commentaire : elle ne compile pas encore, le checkpoint n'a pas
   de code. Mais je veux garder le plan sous les yeux.

   But : poser en base, EN LOT, les N mémoires d'un checkpoint, dans UNE seule
   transaction (tout ou rien). Elle ne vivra pas seule -> elle sera appelée
   À L'INTÉRIEUR de la transaction qui crée le checkpoint.

   import { insertMemoireDal } from "../dal/memoireDAL";

   Pour chaque mémoire proposée (déjà validée par le validator) :
     - je connais l'ordre du checkpoint courant (il vient du checkpoint)
     - je construis le slug : construireSlugMemoire(npcKey, nature, ordre, cibleSlug)
     - j'insère : insertMemoireDal(id_npc, id_checkpoint, slug, contenu, cible_type, cible_slug)
   Le tout enveloppé dans db.transaction(...).
--------------------------------------------------------------------------- */
