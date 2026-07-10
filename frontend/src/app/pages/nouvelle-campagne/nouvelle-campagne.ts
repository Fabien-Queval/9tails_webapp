import { Component, signal, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampagneService } from '../../services/campagne';
import {PersonnageService} from '../../services/personnage';
import {slugPc} from '../../utils/slug';
import { Router } from '@angular/router';
import { ArcService } from '../../services/arc';

@Component({
  selector: 'app-nouvelle-campagne',
  imports: [ReactiveFormsModule, RouterLink],   // ⚠️ RouterLink requis pour les liens "Annuler"
  templateUrl: './nouvelle-campagne.html',
  styleUrl: './nouvelle-campagne.scss',
})
export class NouvelleCampagne {
  private outilCampagneService = inject(CampagneService);

  etape = signal(1);
  idCampagne = signal<number | null>(null);

  // ---------------- Étape ① : Setting ----------------
  formulaire = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)] }),
    genre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)] }),
    description: new FormControl('', { nonNullable: true }),
    maturite: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  validerSetting() {
    const saisie = this.formulaire.getRawValue();
    this.outilCampagneService
      .creerCampagne(saisie.titre, saisie.genre, saisie.description, Number(saisie.maturite))
      .subscribe(reponse => {
        this.idCampagne.set(reponse.campagne.id_campagne);
        this.etape.set(2);
      });
  }

  // ---------------- Étape ② : Personnage ----------------

  private outilPersonnageService = inject(PersonnageService);

  // Ce qu'on TAPE (texte) → Reactive Forms.
  formulairePersonnage = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    race: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classe: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  // Ce qu'on CLIQUE (nombres pilotés par des boutons, avec un budget) → signals + computed.
  cles = ['corps', 'sens', 'esprit', 'social'] as const;

  rang = signal(1);                                    // démarre à 1 : la base refuse 0
  caracs = signal({ corps: 0, sens: 0, esprit: 0, social: 0 });

  // computed = valeur DÉRIVÉE : jamais stockée, recalculée dès qu'un signal source change.
  pointsTotal    = computed(() => this.rang() * 2);
  pointsDepenses = computed(() => {
    const c = this.caracs();
    return c.corps + c.sens + c.esprit + c.social;
  });
  pointsRestants = computed(() => this.pointsTotal() - this.pointsDepenses());

  // Plafond d'UNE carac = rang + 1, sans jamais dépasser 7 (la limite dure de la base).
    plafondCarac = computed(() => Math.min(this.rang() + 1, 7));

  echelleRang = [
    { valeur: 1, nom: 'Norme' },
    { valeur: 2, nom: 'Maîtrise' },
    { valeur: 3, nom: 'Exception' },
    { valeur: 4, nom: 'Héroïque' },
    { valeur: 5, nom: 'Surhumain' },
    { valeur: 6, nom: 'Mythique' },
    { valeur: 7, nom: 'Divin' },
  ];

  choisirRang(valeur: number) {
    this.rang.set(valeur);
    this.caracs.set({ corps: 0, sens: 0, esprit: 0, social: 0 }); // budget changé → on repart propre
  }

  incrementer(cle: 'corps' | 'sens' | 'esprit' | 'social') {
    if (this.pointsRestants() <= 0) return;      // plus de points à dépenser
    const c = this.caracs();
    if (c[cle] >= this.plafondCarac()) return;   // plafond lié au rang (rang + 1)
    this.caracs.set({ ...c, [cle]: c[cle] + 1 });
  }

  decrementer(cle: 'corps' | 'sens' | 'esprit' | 'social') {
    const c = this.caracs();
    if (c[cle] <= 0) return;                   // plancher à 0
    this.caracs.set({ ...c, [cle]: c[cle] - 1 });
  }

  suivant() {
    this.etape.set(this.etape() + 1);
  }

  validerPersonnage() {
    const id = this.idCampagne();          // les () : on LIT la valeur du signal
    if (id === null) return;               // garde : pas de campagne → pas de perso (et id devient un number sûr)

    const saisie = this.formulairePersonnage.getRawValue();
    const descriptionFinale = `Race : ${saisie.race}\nClasse : ${saisie.classe}\n\n${saisie.description}`;
    const fiche_json = {
      version_fiche_pc: '1.0.0' as const,
      rang_aventure: this.rang(),
      caracteristiques: this.caracs(),
    };

    this.outilPersonnageService
      .creerPersonnage(id, slugPc(saisie.nom), saisie.nom, descriptionFinale, fiche_json)
      .subscribe(() => this.etape.set(3));
  }



  // ---------------- Étape ③ : Arc ----------------

  private arcService = inject(ArcService);
  private router = inject(Router);

  objectifs = ['SAUVETAGE', 'FUITE', 'VOL', 'ASSASSINAT', 'VICTOIRE', 'AUTRE'];
  tons = ['SOMBRE', 'EPIQUE', 'MYSTERIEUX', 'LEGER', 'COMEDIE', 'HORREUR'];

  objectif = signal('');
  objectifAutre = signal('');   // texte libre quand objectif === 'AUTRE'
  ton = signal('');
  contexte = signal('');

  // Lecteur : récupère la valeur d'un <select>/<textarea> depuis l'événement du DOM.
  lireValeur(evenement: Event): string {
    return (evenement.target as HTMLInputElement).value;
  }

  creerLaCampagne() {
    const id = this.idCampagne();
    if (id === null) return;

    // Si l'objectif est "AUTRE", on prend le texte libre à la place.
    const objectifFinal = this.objectif() === 'AUTRE' ? this.objectifAutre() : this.objectif();

    const titre  = `Acte 1 - ${objectifFinal} + ${this.ton()}`;
    const resume = `Ton : ${this.ton()}\nObjectif : ${objectifFinal}\nContexte : ${this.contexte()}`;

    this.arcService.creerArc(id, titre, resume).subscribe(() => {
      this.router.navigate(['/tableau-de-bord']);   // créé → retour dashboard (campagne reste BROUILLON)
    });
  }


}
