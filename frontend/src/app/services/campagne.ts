// L'interface = le calque de ton interface Campagne backend
import {Observable} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

// Aide à l'écriture du code. C'est pas obligatoire, mais vachement pratique; ça permet l'auto completion.
export interface Campagne {
  id_campagne: number;
  id_utilisateur: number;
  titre: string;
  genre: string;
  description: string | null;
  maturite: number;
  statut: string;
  date_creation: string;
}

@Injectable({ providedIn: 'root' })
export class CampagneService {
  private http = inject(HttpClient);

  getCampagnes(): Observable<{ campagnes: Campagne[] }> {
    return this.http.get<{ campagnes: Campagne[] }>(
      'http://localhost:3000/api/campagnes',
    );
  }

  creerCampagne(titre: string,
                genre: string,
                description: string,
                maturite: number): Observable<{ campagne: Campagne[] }> {
    return this.http.post<{ campagne: Campagne[] }>(
      'http://localhost:3000/api/campagnes',
      { titre, genre, description, maturite}
    )
  }
}
