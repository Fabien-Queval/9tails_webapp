import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { JeuService, JetPropose } from '../../services/jeu';

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

  // Le jet que Maïa réclame, tant qu'il n'est pas lancé (null = aucun jet en cours).
  jetEnAttente = signal<JetPropose | null>(null);

  // Je bloque la saisie si Maïa réfléchit OU si un jet attend d'être lancé.
  saisieBloquee = computed(() => this.enChargement() || this.jetEnAttente() !== null);

  // La modale de dés est-elle ouverte ? (false au départ : pas de modale dans la figure)
  modaleOuverte = signal(false);


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
    if (!texte || this.saisieBloquee()) return;    // vide, OU (réflexion / jet en attente) → on bloque

    this.messages.update(fil => [...fil, { emetteur: 'JOUEUR', contenu: texte }]);
    this.action.reset();
    this.enChargement.set(true);                   // je verrouille le temps de l'appel

    this.jeuService.jouer(this.idCampagne(), texte).subscribe({
      next: (reponse) => {
        // Maïa a répondu : je pousse son récit dans le fil.
        this.messages.update(fil => [...fil, { emetteur: 'MJ', contenu: reponse.recit }]);
        this.enChargement.set(false);              // fin de l'attente réseau

        // Si elle réclame un jet, je le mets en attente → la saisie reste bloquée
        // et le bouton "Lancer les dés" apparaît (le clic ouvrira la modale, en B5).
        if (reponse.jet_propose) {
          this.jetEnAttente.set(reponse.jet_propose);
        }
      },
      error: () => {
        this.enChargement.set(false);              // erreur → je déverrouille AUSSI (sinon bloqué à vie)
      },
    });
  }

  // Le clic du bouton de jet (B4) ouvre la modale ; le vrai lancer est dans resoudreJet().
  lancerLesDes(): void {
    this.modaleOuverte.set(true);
  }

  // resoudreJet : le clic "Lancer" dans la modale. Je lance le jet, puis j'envoie le résultat à Maïa.
  resoudreJet(): void {
    const jet = this.jetEnAttente();
    if (!jet) return;                                   // garde : pas de jet en attente → rien à résoudre, je sors

    // 1. Je demande le jet au backend : juste carac + difficulté. Le pool, c'est LUI qui le calcule (fiche + formule).
    this.jeuService.lancerJet(this.idCampagne(), jet.caracteristique, jet.difficulte).subscribe({
      next: (res) => {
        // 2. Je formate le résultat en une ligne lisible (carac → pool, dés, succès, verdict).
        const issue = res.resultat === 'success' ? 'réussite' : 'échec (fail forward)';
        const des = res.desResultat.join(', ');   // les dés obtenus
        const ligne = `[Jet de ${jet.caracteristique} ${res.rang} → ${res.pool} dés · difficulté ${jet.difficulte} · dés : ${des} · ${res.success} succès → ${issue} (marge ${res.marge})]`;

        // 3. Je ferme la modale et je vide le jet en attente.
        this.modaleOuverte.set(false);
        this.jetEnAttente.set(null);

        // 4. Le résultat repart dans le fil comme une action → Maïa narre la conséquence.
        this.messages.update(fil => [...fil, { emetteur: 'JOUEUR', contenu: ligne }]);   // affichage local immédiat
        this.enChargement.set(true);                                                     // je reverrouille le temps de l'appel
        this.jeuService.jouer(this.idCampagne(), ligne).subscribe({                      // ← le VRAI post au backend
          next: (reponse) => {
            this.messages.update(fil => [...fil, { emetteur: 'MJ', contenu: reponse.recit }]);
            this.enChargement.set(false);
            if (reponse.jet_propose) this.jetEnAttente.set(reponse.jet_propose);          // elle peut redemander un jet
          },
          error: () => this.enChargement.set(false),
        });
      },
      error: () => this.enChargement.set(false),
    });
  }
}
