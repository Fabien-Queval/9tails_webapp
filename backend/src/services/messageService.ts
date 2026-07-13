import {
    Emetteur,
    Message,
    getDerniersMessagesDal,
    getMaxOrdreMessageDal,
    insertMessageDal
} from "../dal/messageDAL";
import {assertProprietaireCampagne} from "./campagneService";

// Convention d'ordre des params (anti-inversion) : toujours (id_utilisateur, id_campagne, ...),
// le même ordre que createArc/terminerArc -> je n'ai jamais à deviner qui vient en premier.

// Je grave un message du fil : je vérifie d'abord le droit (IDOR), puis je numérote et j'insère.
export function enregistrerMessage(id_utilisateur: number,
                                   id_campagne: number,
                                   emetteur: Emetteur,
                                   contenu: string): Message {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    // Pas de transaction ici (Nuance 1) : un seul insert, jeu solo tour-par-tour = pas de concurrence.
    // Le UNIQUE(id_campagne, ordre) reste mon filet si jamais deux ordres se marchaient dessus.
    const ordre = getMaxOrdreMessageDal(id_campagne) + 1;

    return insertMessageDal(id_campagne, emetteur, contenu, ordre);
}

// Je lis la fenêtre glissante : droit vérifié, puis je rends les N derniers messages (chronologiques).
export function lireFilRecent(id_utilisateur: number,
                              id_campagne: number,
                              limite: number): Message[] {
    assertProprietaireCampagne(id_campagne, id_utilisateur);

    return getDerniersMessagesDal(id_campagne, limite);
}
