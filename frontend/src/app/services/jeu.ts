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
}
