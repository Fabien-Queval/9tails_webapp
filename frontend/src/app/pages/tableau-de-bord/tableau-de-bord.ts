import { Component, inject, OnInit, signal } from '@angular/core';
import { Campagne, CampagneService } from '../../services/campagne';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-tableau-de-bord',
  imports: [
    RouterLink
  ],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss',
})
export class TableauDeBord implements OnInit {
  private campagneListe = inject(CampagneService);
  campagnes = signal<Campagne[]>([]);

  ngOnInit(): void {
    this.campagneListe.getCampagnes().subscribe({
      next: (reponse) => this.campagnes.set(reponse.campagnes),
    });
  }

  // NOTE (Tamamo) : j'ai retiré d'ici le FormGroup de création que tu avais écrit.
  // La maquette ne met PAS de formulaire sur le dashboard — la création est un
  // assistant dédié (Setting → Personnage → Arc). Ton FormGroup n'est pas perdu :
  // il renaîtra dans l'écran "① Setting" du futur wizard. Je te l'ai remis dans le chat.
}
