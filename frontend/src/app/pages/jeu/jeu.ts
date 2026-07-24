import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { JeuService, JetPropose, NpcPropose, SouvenirPropose } from '../../services/jeu';
import {FicheJson, Personnage, PersonnageService} from '../../services/personnage';

// Un message du fil, tel qu'on l'affiche : qui parle + son texte.
type MessageFil = { emetteur: 'JOUEUR' | 'MJ'; contenu: string };

@Component({
  selector: 'app-jeu',
  imports: [ReactiveFormsModule, KeyValuePipe],
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

  private personnageService = inject(PersonnageService);

  personnage = signal<Personnage | null>(null);

  fiche = computed<FicheJson | null>(() => {
    const pc = this.personnage();
    return pc ? JSON.parse(pc.fiche_json) as FicheJson : null;
  });

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

  // Le panneau latéral gauche (fiche perso, journal, codex) est-il déplié ?
  // true au départ pour qu'il soit visible d'emblée ; bascule sur false si tu préfères
  // laisser un maximum de place au fil dès l'arrivée sur l'écran.
  panneauOuvert = signal(true);

  // Suis-je en train de débriefer ? (verrou du bouton pendant l'appel payant — même rôle qu'enChargement)
  enDebrief = signal(false);

  // Seuil de "scène pleine" : au-delà, on presse le joueur à clôturer (nudge, JAMAIS un verrou).
  // Volontairement sous NB_MESSAGES_DEBRIEF (100, backend) : on invite AVANT que la fenêtre du débrief ne déborde.
  readonly SEUIL_DEBRIEF = 40;

  // Repère posé au dernier débrief : la jauge compte les messages APPARUS DEPUIS.
  private jaugeBase = signal(0);

  // La jauge = messages de la scène en cours (fil actuel − repère du dernier débrief).
  jaugeScene   = computed(() => this.messages().length - this.jaugeBase());
  jaugePleine  = computed(() => this.jaugeScene() >= this.SEUIL_DEBRIEF);   // pilote la COULEUR, pas le bouton
  pourcentageJauge = computed(() => Math.min(100, (this.jaugeScene() / this.SEUIL_DEBRIEF) * 100));

  // --- Modale de CLÔTURE (débrief) : Maïa PROPOSE → l'humain valide → on grave ---
  modaleDebrief  = signal(false);                                     // la modale est-elle ouverte ?
  arcDebrief     = signal<number | null>(null);                       // l'arc à qui rattacher le checkpoint (renvoyé par le débrief)
  propCheckpoint = signal<{ titre: string; resume: string; contenu: string } | null>(null);
  propNpcs       = signal<NpcPropose[]>([]);                          // PNJ proposés, retirables
  propMemoires   = signal<SouvenirPropose[]>([]);                     // souvenirs proposés, retirables
  enregistrement = signal(false);                                     // verrou du bouton "Enregistrer"
  erreurDebrief  = signal<string | null>(null);                       // erreur affichée DANS la modale (plus d'avalage silencieux)


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

    // Je charge aussi la fiche de perso pour le widget
    this.personnageService.getPersonnageByCampagneFront(this.idCampagne()).subscribe({
      next: (reponse) => this.personnage.set(reponse.personnage),
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

  // Le clic "Clôturer la scène" : je récupère l'arc ouvert, PUIS je demande à Maïa une PROPOSITION.
  // Rien n'est gravé ici — j'ouvre la modale de validation, l'humain tranche, le commit vient après.
  debriefer(): void {
    if (this.enDebrief()) return;          // garde : un débrief tourne déjà → je sors
    this.enDebrief.set(true);              // je verrouille le bouton
    this.erreurDebrief.set(null);

    // 1. L'arc ENCORE OUVERT (le dernier).
    this.jeuService.getArcsEnCours(this.idCampagne()).subscribe({
      next: (reponse) => {
        const arc = reponse.arcs[reponse.arcs.length - 1];
        if (!arc) {                        // aucun arc ouvert → rien à clôturer
          this.erreurDebrief.set('Aucun arc ouvert à clôturer.');
          this.enDebrief.set(false);
          return;
        }

        // 2. La PROPOSITION de Maïa (appel payant). Je remplis la modale, je ne grave RIEN.
        this.jeuService.debriefer(this.idCampagne(), arc.id_arc).subscribe({
          next: (res) => {
            this.arcDebrief.set(res.id_arc);
            this.propCheckpoint.set({ titre: res.debrief.titre, resume: res.debrief.resume, contenu: res.debrief.contenu });
            this.propNpcs.set(res.debrief.nouveaux_personnages);
            this.propMemoires.set(res.debrief.souvenirs);
            this.modaleDebrief.set(true);        // j'ouvre la modale de validation
            this.enDebrief.set(false);
          },
          error: (err) => {
            this.erreurDebrief.set(err.error?.message ?? 'Échec du débrief.');
            this.enDebrief.set(false);
          },
        });
      },
      error: () => this.enDebrief.set(false),
    });
  }

  // Validation humaine : retirer un PNJ ou un souvenir proposé avant de graver.
  retirerNpc(i: number): void {
    this.propNpcs.update(list => list.filter((_, idx) => idx !== i));
  }
  retirerMemoire(i: number): void {
    this.propMemoires.update(list => list.filter((_, idx) => idx !== i));
  }

  // Le clic "Enregistrer ce checkpoint" : je grave la proposition VALIDÉE (checkpoint + PNJ + souvenirs retenus).
  enregistrerCheckpoint(): void {
    const cp = this.propCheckpoint();
    const arc = this.arcDebrief();
    if (!cp || arc === null || this.enregistrement()) return;

    this.enregistrement.set(true);
    this.erreurDebrief.set(null);

    this.jeuService.enregistrerCheckpoint(this.idCampagne(), arc, {
      titre:   cp.titre,
      resume:  cp.resume,
      contenu: cp.contenu,
      nouveauxPersonnages: this.propNpcs(),
      memoires:            this.propMemoires(),
    }).subscribe({
      next: () => {
        // Gravé : je referme, je confirme dans le fil, je remets la jauge à zéro.
        this.messages.update(fil => [...fil, { emetteur: 'MJ', contenu: `— Scène clôturée : « ${cp.titre} » — ${cp.resume}` }]);
        this.jaugeBase.set(this.messages().length);
        this.modaleDebrief.set(false);
        this.enregistrement.set(false);
      },
      error: (err) => {
        // Plus d'avalage silencieux : j'affiche l'erreur DANS la modale, l'humain corrige et réessaie.
        this.erreurDebrief.set(err.error?.message ?? "Échec de l'enregistrement.");
        this.enregistrement.set(false);
      },
    });
  }

}
