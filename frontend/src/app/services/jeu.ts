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
}
