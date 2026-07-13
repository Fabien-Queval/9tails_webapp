import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

  onglet = signal<'ACTIVE' | 'ARCHIVEE' | 'BROUILLON'>('ACTIVE');

  campagnesFiltrees = computed(() =>
    this.campagnes().filter(campagne => campagne.statut === this.onglet())
  );

  ngOnInit(): void {
    this.chargerCampagnes();
  }

  // Je sors le chargement dans sa propre méthode pour pouvoir le rappeler
  // après chaque action (activer / archiver) et garder la liste à jour.
  private chargerCampagnes(): void {
    this.campagneListe.getCampagnes().subscribe({
      next: (reponse) => this.campagnes.set(reponse.campagnes),
    });
  }

  // Au clic "Activer" : j'appelle le service, puis je recharge la liste DANS le next.
  // Résultat : la campagne quitte l'onglet Brouillons et rejoint les Actives.
  activer(id: number): void {
    this.campagneListe.activerCampagne(id).subscribe(() => this.chargerCampagnes());
  }

  // Au clic "Archiver" : même geste, la campagne passe de Actives à Archivées.
  archiver(id: number): void {
    this.campagneListe.archiverCampagne(id).subscribe(() => this.chargerCampagnes());
  }
}
