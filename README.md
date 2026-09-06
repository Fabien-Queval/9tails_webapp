# 9Tails

> Application fullstack de jeu de rôle narratif motorisé par IA.

9Tails est une application fullstack développée dans le cadre de ma formation **Développeur Web et Web Mobile**.

Elle permet de créer et de jouer des campagnes de jeu de rôle narratif dont le moteur de narration utilise un **LLM**, tout en conservant côté application l'état du monde, des personnages et de la campagne.

## Stack technique

**Angular • TypeScript • Node.js • Express • SQLite • Anthropic API • JWT • Jest**

---

## V0 — Le parcours complet du joueur

La V0 permet de parcourir l'ensemble de la boucle principale de l'application :

* Inscription, connexion et session persistante
* Création d'une campagne via un assistant
* Création du personnage joueur
* Gestion des arcs narratifs :

  * création
  * listing filtré par statut
  * clôture
* Jeu d'un tour :

  * génération de la narration
  * jet de dés résolu côté serveur
  * persistance de l'historique des messages
* Clôture d'une scène :

  * création d'un checkpoint
  * génération d'un débrief
  * proposition puis validation des mémoires de PNJ
  * génération d'un snapshot JSON
* Gestion des PNJ :

  * création
  * listing
  * consultation
  * modification
  * activation / archivage
  * suppression

### Frontend

L'application comprend actuellement **6 écrans Angular** :

1. Accueil
2. Inscription
3. Connexion
4. Tableau de bord
5. Nouvelle campagne
6. Jeu

Le frontend dispose également :

* d'un `authGuard`
* d'un intercepteur JWT

---

## API

Le backend expose environ **30 endpoints**, répartis sur **8 fichiers de routes**.

L'API couvre notamment :

* l'authentification
* les campagnes
* les personnages
* les PNJ
* les arcs narratifs
* les sessions de jeu
* les checkpoints
* les mémoires

---

## Modèle de données

La base de données comporte actuellement :

* **15 tables**
* **19 clés étrangères**
* SQL écrit à la main avec `better-sqlite3`
* contraintes `UNIQUE` composites
* contraintes `CHECK`
* validation des slugs par regex
* suppressions en cascade
* transactions

Les données sont cloisonnées par `id_campagne`.

---

## Intelligence artificielle — le MJ

L'intégration du modèle est réalisée **uniquement côté serveur** via le SDK Anthropic.

Le principe retenu est volontairement simple :

> **Le modèle propose, le backend décide.**

Les sorties du modèle sont structurées puis validées avec **Zod** avant toute écriture en base.

Le système utilise également le **tool use** pour certains mécanismes de jeu, notamment les jets de dés, afin que leur résolution reste contrôlée par l'application et non directement par le modèle.

---

## Sécurité

Plusieurs protections sont déjà présentes :

* Hash des mots de passe avec `bcrypt`
* Authentification par JWT
* Middleware d'authentification
* Requêtes SQL préparées
* Gardes de propriété contre les vulnérabilités de type **IDOR**

Les contrôles de propriété ne se contentent pas de faire confiance aux identifiants transmis par la requête : la ressource concernée est relue en base afin de vérifier qu'elle appartient bien à l'utilisateur et à la campagne attendue.

---

## Tests

Le backend dispose actuellement de :

* **4 suites Jest**
* un fichier `requests.http`
* **46 requêtes enchaînées**
* **50 assertions**

Les tests couvrent :

* les parcours nominaux
* les erreurs `400`
* les erreurs `404`
* les conflits `409`
* les gardes de sécurité

---

# V0 — Présent mais pas encore branché

Le projet est une V0 fonctionnelle, mais plusieurs éléments existent déjà dans le modèle ou dans le code sans être encore reliés à la boucle de jeu complète.

Je préfère les identifier explicitement.

## Journal

La table existe et l'interface dispose déjà du bouton correspondant.

En revanche, aucune entrée n'est actuellement écrite.

`ENTREE_JOURNAL` ne dispose pas encore de :

* DAL
* service
* route

## Codex

La vue reste à brancher.

Les données nécessaires sont déjà présentes dans les différentes entités :

* `slug`
* `nom`
* `description`

Notamment pour :

* `NPC`
* `PERSONNAGE`
* `LIEU`
* `OBJET`
* `ORGANISATION`

## Snapshot

`generateSnapshot` est implémentée et permet de produire le snapshot d'un checkpoint.

En revanche, `readSnapshot` n'est actuellement jamais appelée.

Le snapshot n'est donc pas encore réinjecté dans le contexte envoyé au modèle.

## Déploiement

Le projet fonctionne actuellement **uniquement en local**.

Une procédure de déploiement a été documentée dans l'Annexe B de mon dossier de projet, mais elle n'a pas encore été exécutée.

Certaines configurations restent donc encore liées à l'environnement local :

* URLs
* CORS
* `localhost`

## Build de production

🔴 **Le build de production comporte actuellement un défaut identifié.**

La commande :

```bash
npm run build
```

exécute uniquement :

```bash
tsc
```

Le fichier `init_regles.json` n'est donc pas copié dans `dist/`.

Conséquence : une version compilée casse actuellement lors du premier tour de jeu lorsqu'elle tente de charger ce fichier.

La correction prévue consiste à ajouter une étape de copie des ressources JSON après la compilation TypeScript.

---

# Prochaines étapes

## 1. Réparer le build

* Copier les fichiers `.json` nécessaires après `tsc`
* Corriger `check-db`, qui attend encore 14 tables au lieu de 15

## 2. Durcir le backend

* Vérifier que l'organisation associée à un PNJ appartient bien à la campagne concernée
* Résoudre `cible_slug` en base avant écriture
* Contrôler l'arc avant de déclencher un appel facturé au modèle
* Ajouter une limitation de débit
* Ajouter une validation serveur lors de la modification d'une campagne

## 3. Améliorer la qualité HTTP

* Distinguer correctement les erreurs `500` des erreurs `400`
* Trancher consciemment le comportement entre `403` et `404` pour certaines ressources protégées

## 4. Relier les fonctionnalités existantes

* Journal jouable
* Codex
* Réinjection des snapshots dans le contexte du modèle

## 5. Améliorer le frontend

* Réparer la suite de tests Angular
* Ajouter un piège à focus dans les modales
* Permettre leur fermeture avec `Échap`
* Ajouter une garde de route sur la création de campagne

## 6. Déployer

* Obtenir un build reproductible
* Sortir la configuration du code
* Mettre en place Caddy
* Activer HTTPS

---

## Objectif du projet

9Tails est à la fois un projet de formation et un terrain d'expérimentation autour d'une question qui m'intéresse particulièrement :

> **Comment utiliser un LLM dans une application sans lui abandonner la logique métier ?**

L'objectif est de conserver une séparation claire entre :

* la narration générative produite par le modèle
* l'état persistant de l'application
* les règles métier
* les décisions qui doivent rester déterministes côté serveur

L'IA devient ainsi un composant du système, et non le système lui-même.
