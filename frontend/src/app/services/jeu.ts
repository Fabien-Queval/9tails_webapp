import { Observable } from 'rxjs';
import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';


// Le jet que Maïa propose (miroir du backend ; redéclaré ici car front et back sont 2 projets séparés).
export type JetPropose = {
  caracteristique: 'CORPS' | 'SENS' | 'ESPRIT' | 'SOCIAL';
  difficulte: number;
  raison: string;
};

// Le résultat d'un jet, tel que roll() le rend (miroir du RollResult backend).
export type RollResult = {
  test: string;
  difficulte: number;
  desResultat: number[];
  success: number;
  marge: number;
  resultat: 'success' | 'fail_forward';
};

// Un PNJ que Maïa propose de créer au débrief (miroir de NouveauPersonnageSchema backend).
export type NpcPropose = { nom: string; description: string };

// Un souvenir proposé par Maïa (miroir de MemoireProposeeSchema backend).
// cible_type/cible_slug typés larges : le front ne fait que les AFFICHER et les RENVOYER tels quels.
export type SouvenirPropose = {
  npc: string;
  nature: string;
  cible_type: string | null;
  cible_slug: string | null;
  contenu: string;
};

// La PROPOSITION de débrief que Maïa renvoie (RIEN n'est encore gravé — l'humain valide dans la modale).
export type DebriefPropose = {
  titre: string;
  resume: string;
  contenu: string;
  nouveaux_personnages: NpcPropose[];
  souvenirs: SouvenirPropose[];
};

@Injectable({ providedIn: 'root' })
export class JeuService {
  private http = inject(HttpClient);

  // J'envoie l'action du joueur ; je reçois le récit du MJ + un jet éventuel.
  // POST /api/campagnes/:id/jouer — corps { actionJoueur } → { recit, jet_propose }.
  jouer(idCampagne: number, actionJoueur: string): Observable<{ recit: string; jet_propose: JetPropose | null }> {
    return this.http.post<{ recit: string; jet_propose: JetPropose | null }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/jouer`,
      { actionJoueur }
    );
  }

  // Je récupère tout le fil déjà en base, pour repeupler l'écran au chargement.
  // GET /api/campagnes/:id/messages → { messages: [...] }. Je ne déclare que les champs que l'écran affiche.
  chargerFil(idCampagne: number): Observable<{ messages: { emetteur: 'JOUEUR' | 'MJ'; contenu: string }[] }> {
    return this.http.get<{ messages: { emetteur: 'JOUEUR' | 'MJ'; contenu: string }[] }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/messages`
    );
  }

  // Je lance un jet : j'envoie juste la carac + la difficulté ; le backend calcule le pool depuis la fiche.
  // POST /api/campagnes/:id/jet → RollResult enrichi de { pool, rang }.
  lancerJet(idCampagne: number, caracteristique: string, difficulte: number): Observable<RollResult & { pool: number; rang: number }> {
    return this.http.post<RollResult & { pool: number; rang: number }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/jet`,
      { caracteristique, difficulte }
    );
  }

  // Je vais chercher les arcs ENCORE OUVERTS de la campagne : c'est là que je rattacherai le débrief.
  // GET /api/campagnes/:id/arcs?statut=EN_COURS  →  { arcs: [...] }
  // Le "?statut=EN_COURS" au bout de l'URL, c'est un FILTRE que mon backend lit tout seul.
  // Je ne déclare que les 2 champs qui me serviront : l'id_arc (pour la route débrief) et le titre (pour l'affichage).
  getArcsEnCours(idCampagne: number): Observable<{ arcs: { id_arc: number; titre: string }[] }> {
    return this.http.get<{ arcs: { id_arc: number; titre: string }[] }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/arcs?statut=EN_COURS`
    );
  }

  // Je demande à Maïa une PROPOSITION de débrief : elle synthétise la scène, mais RIEN n'est gravé.
  // POST /api/campagnes/:id/arcs/:id_arc/debrief — corps {} (Maïa lit le fil côté backend).
  // Je reçois { debrief, id_arc } : la proposition à valider + l'arc à qui rattacher le checkpoint.
  debriefer(idCampagne: number, idArc: number): Observable<{ debrief: DebriefPropose; id_arc: number }> {
    return this.http.post<{ debrief: DebriefPropose; id_arc: number }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/arcs/${idArc}/debrief`,
      {}
    );
  }

  // Le COMMIT de la clôture, une fois l'humain validé dans la modale : je grave le checkpoint
  // (+ les PNJ retenus + les souvenirs retenus). POST /api/campagnes/:id/arcs/:id_arc/checkpoints.
  enregistrerCheckpoint(
    idCampagne: number,
    idArc: number,
    payload: { titre: string; resume: string; contenu: string; nouveauxPersonnages: NpcPropose[]; memoires: SouvenirPropose[] }
  ): Observable<unknown> {
    return this.http.post(
      `http://localhost:3000/api/campagnes/${idCampagne}/arcs/${idArc}/checkpoints`,
      payload
    );
  }

}
