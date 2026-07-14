import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class JeuService {
  private http = inject(HttpClient);

  // J'envoie l'action du joueur, je reçois la narration du MJ.
  // POST /api/campagnes/:id/jouer — corps { actionJoueur } → { narration }.
  jouer(idCampagne: number, actionJoueur: string): Observable<{ narration: string }> {
    return this.http.post<{ narration: string }>(
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
}
