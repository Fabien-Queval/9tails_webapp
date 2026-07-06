-- =============================================================================
-- 9TStory V0 — Script DDL SQLite
-- Genere depuis MLD_canvas.md — version finale (09/06/2026)
-- MAJ 16/06/2026 : ajout des ON DELETE CASCADE (composition campagne)
-- =============================================================================
-- Ce fichier doit etre execute via db.exec() dans db.js (better-sqlite3)
-- AVANT d'executer ce DDL, dans db.js :
--     1. db.pragma('foreign_keys = ON')          -> enforce les FKs
--     2. db.function('regexp', ...)              -> active les CHECK REGEXP
-- =============================================================================
-- Regle de suppression (DEL) :
--   - Toutes les FK pointant vers le CONTENU d'une campagne sont ON DELETE
--     CASCADE : la campagne est la racine de composition, sa suppression
--     emporte tout son contenu (arcs, checkpoints, lieux, objets, orgs,
--     personnages, journal, npc, invariants, entrees, memoires, traits).
--   - Les 2 FK vers UTILISATEUR restent NO ACTION (defaut) : l'utilisateur
--     est le parent, il n'appartient pas a la campagne.
-- =============================================================================
-- Ordre de creation (dependances FK) :
-- UTILISATEUR -> CAMPAGNE -> ARC -> CHECKPOINT
-- -> LIEU / OBJET / ORGANISATION
-- -> PERSONNAGE -> JOURNAL -> TRAIT -> NPC
-- -> INVARIANT -> ENTREE_JOURNAL -> MEMOIRE
-- =============================================================================

CREATE TABLE IF NOT EXISTS UTILISATEUR (
  id_utilisateur    INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo            TEXT    NOT NULL,
  email             TEXT    NOT NULL,
  mot_de_passe_hash TEXT    NOT NULL,
  date_creation     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_UTILISATEUR_EMAIL UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS CAMPAGNE (
  id_campagne    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_utilisateur INTEGER NOT NULL REFERENCES UTILISATEUR(id_utilisateur),
  titre          TEXT    NOT NULL,
  genre          TEXT    NOT NULL,
  description    TEXT,
  maturite       INTEGER NOT NULL,
  statut         TEXT    NOT NULL,
  date_creation  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT CK_CAMPAGNE_STATUT   CHECK (statut   IN ('BROUILLON', 'ACTIVE', 'ARCHIVEE')),
  CONSTRAINT CK_CAMPAGNE_MATURITE CHECK (maturite IN (12, 16, 18))
);

CREATE TABLE IF NOT EXISTS ARC (
  id_arc        INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne   INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  titre         TEXT    NOT NULL,
  resume        TEXT,
  statut        TEXT    NOT NULL,
  ordre         INTEGER NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_ARC_CAMPAGNE_ORDRE    UNIQUE (id_campagne, ordre),
  CONSTRAINT CK_ARC_STATUT           CHECK  (statut IN ('BROUILLON', 'EN_COURS', 'TERMINE', 'ARCHIVE')),
  CONSTRAINT CK_ARC_ORDRE_POSITIF    CHECK  (ordre > 0)
);

CREATE TABLE IF NOT EXISTS CHECKPOINT (
  id_checkpoint INTEGER PRIMARY KEY AUTOINCREMENT,
  id_arc        INTEGER NOT NULL REFERENCES ARC(id_arc) ON DELETE CASCADE,
  titre         TEXT    NOT NULL,
  contenu       TEXT    NOT NULL,
  resume        TEXT    NOT NULL,
  ordre         INTEGER NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_CHECKPOINT_ARC_ORDRE   UNIQUE (id_arc, ordre),
  CONSTRAINT CK_CHECKPOINT_ORDRE_POSITIF CHECK (ordre > 0)
);

CREATE TABLE IF NOT EXISTS LIEU (
  id_lieu       INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne   INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  slug          TEXT    NOT NULL,
  nom           TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_LIEU_CAMPAGNE_SLUG   UNIQUE (id_campagne, slug),
  CONSTRAINT CK_LIEU_SLUG_FORMAT     CHECK  (slug REGEXP '^loc_[a-z0-9]+(_[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS OBJET (
  id_objet      INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne   INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  slug          TEXT    NOT NULL,
  nom           TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  effet_rang    INTEGER NOT NULL DEFAULT 0,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_OBJET_CAMPAGNE_SLUG      UNIQUE (id_campagne, slug),
  CONSTRAINT CK_OBJET_SLUG_FORMAT        CHECK  (slug REGEXP '^obj_[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT CK_OBJET_EFFET_RANG_RANGE   CHECK  (effet_rang BETWEEN -2 AND 2)
);

CREATE TABLE IF NOT EXISTS ORGANISATION (
  id_organisation INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne     INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  slug            TEXT    NOT NULL,
  nom             TEXT    NOT NULL,
  description     TEXT    NOT NULL,
  relation_pc     INTEGER NOT NULL DEFAULT 0,
  date_creation   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_ORGANISATION_CAMPAGNE_SLUG       UNIQUE (id_campagne, slug),
  CONSTRAINT CK_ORGANISATION_SLUG_FORMAT         CHECK  (slug REGEXP '^org_[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT CK_ORGANISATION_RELATION_PC_RANGE   CHECK  (relation_pc BETWEEN -100 AND 100)
);

CREATE TABLE IF NOT EXISTS PERSONNAGE (
  id_personnage  INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne    INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  id_utilisateur INTEGER NOT NULL REFERENCES UTILISATEUR(id_utilisateur),
  slug_pc        TEXT    NOT NULL,
  nom            TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  fiche_json     TEXT    NOT NULL,
  date_creation  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_PERSONNAGE_CAMPAGNE_UTILISATEUR   UNIQUE (id_campagne, id_utilisateur),
  CONSTRAINT UK_PERSONNAGE_CAMPAGNE_SLUG_PC       UNIQUE (id_campagne, slug_pc),
  CONSTRAINT CK_PERSONNAGE_SLUG_PC_FORMAT         CHECK  (slug_pc REGEXP '^pc_[a-z0-9]+(_[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS JOURNAL (
  id_journal    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne   INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  titre         TEXT    NOT NULL,
  description   TEXT,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_JOURNAL_CAMPAGNE UNIQUE (id_campagne)
);

CREATE TABLE IF NOT EXISTS TRAIT (
  id_trait      INTEGER PRIMARY KEY AUTOINCREMENT,
  id_personnage INTEGER NOT NULL REFERENCES PERSONNAGE(id_personnage) ON DELETE CASCADE,
  code_trait    TEXT    NOT NULL,
  type_trait    TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_TRAIT_PERSONNAGE_CODE   UNIQUE (id_personnage, code_trait),
  CONSTRAINT CK_TRAIT_CODE_FORMAT       CHECK  (code_trait REGEXP '^<[a-z0-9]+(_[a-z0-9]+)*(_rk[1-7])?>$'),
  CONSTRAINT CK_TRAIT_TYPE              CHECK  (type_trait IN ('POSITIF', 'NEGATIF', 'NARRATIF', 'CONTEXTUEL'))
);

CREATE TABLE IF NOT EXISTS NPC (
  id_npc          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne     INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  id_organisation INTEGER NOT NULL REFERENCES ORGANISATION(id_organisation) ON DELETE CASCADE,
  slug            TEXT    NOT NULL,
  nom             TEXT    NOT NULL,
  description     TEXT,
  fiche_json      TEXT    NOT NULL,
  statut          TEXT    NOT NULL,
  relation_pc     INTEGER NOT NULL DEFAULT 0,
  date_creation   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_NPC_CAMPAGNE_SLUG        UNIQUE (id_campagne, slug),
  CONSTRAINT CK_NPC_SLUG_FORMAT          CHECK  (slug REGEXP '^npc_[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT CK_NPC_STATUT               CHECK  (statut IN ('ACTIF', 'INACTIF', 'MORT')),
  CONSTRAINT CK_NPC_RELATION_PC_RANGE    CHECK  (relation_pc BETWEEN -100 AND 100)
);

CREATE TABLE IF NOT EXISTS INVARIANT (
  id_invariant  INTEGER PRIMARY KEY AUTOINCREMENT,
  id_campagne   INTEGER NOT NULL REFERENCES CAMPAGNE(id_campagne) ON DELETE CASCADE,
  id_checkpoint INTEGER NOT NULL REFERENCES CHECKPOINT(id_checkpoint) ON DELETE CASCADE,
  titre         TEXT    NOT NULL,
  contenu       TEXT    NOT NULL,
  type_cible    TEXT    NOT NULL,
  slug_cible    TEXT    NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT CK_INVARIANT_TYPE_CIBLE         CHECK (type_cible IN ('OBJET', 'LIEU', 'ORGANISATION', 'NPC', 'PC')),
  CONSTRAINT CK_INVARIANT_SLUG_CIBLE_FORMAT  CHECK (slug_cible REGEXP '^(npc|pc|obj|loc|org)_[a-z0-9]+(_[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS ENTREE_JOURNAL (
  id_entree_journal INTEGER PRIMARY KEY AUTOINCREMENT,
  id_journal        INTEGER NOT NULL REFERENCES JOURNAL(id_journal) ON DELETE CASCADE,
  id_checkpoint     INTEGER          REFERENCES CHECKPOINT(id_checkpoint) ON DELETE CASCADE,
  titre             TEXT    NOT NULL,
  contenu           TEXT    NOT NULL,
  type_entree       TEXT    NOT NULL,
  ordre             INTEGER NOT NULL,
  date_creation     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_ENTREE_JOURNAL_JOURNAL_ORDRE   UNIQUE (id_journal, ordre),
  CONSTRAINT CK_ENTREE_JOURNAL_ORDRE_POSITIF   CHECK  (ordre > 0),
  CONSTRAINT CK_ENTREE_JOURNAL_TYPE            CHECK  (type_entree IN ('MANUELLE', 'CHECKPOINT')),
  CONSTRAINT CK_ENTREE_JOURNAL_CP_COHERENCE    CHECK  (type_entree <> 'CHECKPOINT' OR id_checkpoint IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS MEMOIRE (
  id_memoire    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_npc        INTEGER NOT NULL REFERENCES NPC(id_npc) ON DELETE CASCADE,
  id_checkpoint INTEGER NOT NULL REFERENCES CHECKPOINT(id_checkpoint) ON DELETE CASCADE,
  slug_memoire  TEXT    NOT NULL,
  cible_type    TEXT,
  cible_slug    TEXT,
  contenu       TEXT    NOT NULL,
  date_creation TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CONSTRAINT UK_MEMOIRE_NPC_SLUG            UNIQUE (id_npc, slug_memoire),
  CONSTRAINT CK_MEMOIRE_SLUG_FORMAT         CHECK  (slug_memoire REGEXP '^mem_npc_[a-z0-9]+(_[a-z0-9]+)*_cp[0-9]{3}$'),
  CONSTRAINT CK_MEMOIRE_CIBLE_TYPE          CHECK  (cible_type IS NULL OR cible_type IN ('NPC', 'PC', 'OBJET', 'LIEU', 'ORGANISATION')),
  CONSTRAINT CK_MEMOIRE_CIBLE_COMPLETE      CHECK  ((cible_type IS NULL AND cible_slug IS NULL) OR (cible_type IS NOT NULL AND cible_slug IS NOT NULL)),
  CONSTRAINT CK_MEMOIRE_CIBLE_SLUG_FORMAT   CHECK  (cible_slug IS NULL OR cible_slug REGEXP '^(npc|pc|obj|loc|org)_[a-z0-9]+(_[a-z0-9]+)*$')
);
