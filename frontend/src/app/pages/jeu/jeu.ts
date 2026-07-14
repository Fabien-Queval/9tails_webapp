import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { JeuService } from '../../services/jeu';

// Un message du fil, tel qu'on l'affiche : qui parle + son texte.
type MessageFil = { emetteur: 'JOUEUR' | 'MJ'; contenu: string };

@Component({
  selector: 'app-jeu',
  imports: [ReactiveFormsModule],
  templateUrl: './jeu.html',
  styleUrl: './jeu.scss',
})
export class Jeu implements OnInit {
  // (1) Angular construit l'objet Jeu.

  // (2) Propriétés initialisées, dans l'ordre :
  // (3) route = ma boîte aux lettres d'URL.
  private route = inject(ActivatedRoute);
  //     + le service qui parle au backend de jeu (comme inject(CampagneService) au dashboard).
  private jeuService = inject(JeuService);

  // (4) idCampagne démarre à 0.
  idCampagne = signal<number>(0);

  // Le champ d'action (un seul champ → un simple FormControl, comme au wizard).
  action = new FormControl('', { nonNullable: true });

  // Le fil complet de la session : une LISTE de messages, en signal (zoneless).
  messages = signal<MessageFil[]>([]);

  // Suis-je en train d'attendre la réponse de Maïa ?
  enChargement = signal(false);   // true = une réponse de Maïa est en attente


  // (5) Construction finie. (6) Angular appelle ngOnInit :
  ngOnInit(): void {
    // (7) je lis le :id (string), le passe en nombre, le range dans le signal.
    const idBrut = this.route.snapshot.paramMap.get('id');
    this.idCampagne.set(Number(idBrut));

    // (8) je récupère le fil déjà en base et je remplis le signal DANS le next
    //     (la réponse est async → elle n'existe qu'ici ; zoneless → c'est le .set qui rafraîchit la vue).
    //     Sans ça, l'écran repartait vide à chaque reload alors que les messages étaient bien enregistrés.
    this.jeuService.chargerFil(this.idCampagne()).subscribe({
      next: (reponse) => this.messages.set(reponse.messages),
    });
  }
  // (9) Le template s'affiche avec l'id ET le fil rechargé.

  // Au clic "Envoyer" : j'envoie l'action ; DANS le next, je range la narration reçue.
  // (async : le code après subscribe part tout de suite → la réponse n'existe que dans le next.)
  envoyer(): void {
    const texte = this.action.value.trim();
    if (!texte || this.enChargement()) return;    // vide, OU une réponse est déjà en attente → on bloque

    this.messages.update(fil => [...fil, { emetteur: 'JOUEUR', contenu: texte }]);
    this.action.reset();
    this.enChargement.set(true);                   // je verrouille

    this.jeuService.jouer(this.idCampagne(), texte).subscribe({
      next: (reponse) => {
        this.messages.update(fil => [...fil, { emetteur: 'MJ', contenu: reponse.narration }]);
        this.enChargement.set(false);              // réponse reçue → je déverrouille
      },
      error: () => {
        this.enChargement.set(false);              // erreur → je déverrouille AUSSI (sinon bloqué à vie)
      },
    });
  }
}
