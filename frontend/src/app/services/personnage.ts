import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Personnage {
  id_personnage: number;
  id_campagne: number;
  id_utilisateur: number;
  slug_pc: string;
  nom: string;
  description: string;
  fiche_json: string;   // en base c'est du TEXT (le backend stringifie l'objet reçu)
}

// La fiche telle qu'on l'ENVOIE : un objet imbriqué (le backend la valide avec Zod puis la stringifie).
export interface FicheJson {
  version_fiche_pc: '1.0.0';
  rang_aventure: number;
  caracteristiques: { corps: number; sens: number; esprit: number; social: number };
}

@Injectable({ providedIn: 'root' })
export class PersonnageService {
  private http = inject(HttpClient);

  creerPersonnage(
    idCampagne: number,
    slug_pc: string,
    nom: string,
    description: string,
    fiche_json: FicheJson,
  ): Observable<{ personnage: Personnage }> {
    return this.http.post<{ personnage: Personnage }>(
      `http://localhost:3000/api/campagnes/${idCampagne}/personnage`,   // ⚠️ l'id s'insère dans l'URL (route imbriquée)
      { slug_pc, nom, description, fiche_json },
    );
  }


}
