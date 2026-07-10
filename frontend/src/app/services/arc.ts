import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Arc {
  id_arc: number;
  id_campagne: number;
  titre: string;
  resume: string;
  ordre: number;
  statut: string;
}

@Injectable({ providedIn: 'root' })
export class ArcService {
  private http = inject(HttpClient);

  creerArc(idCampagne: number, titre: string, resume: string): Observable<{ arc: Arc }> {
    return this.http.post<{ arc: Arc }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/arcs`,
      { titre, resume },
    );
  }
}
