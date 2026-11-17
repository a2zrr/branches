// Types du moteur Git simulé. Aucune dépendance à React, Zustand, Motion ou au DOM.

/** Contenu d'un fichier : une chaîne par ligne. */
export type Contenu = readonly string[];
/** Arbre d'un commit : chemin → contenu complet. */
export type Arbre = Readonly<Record<string, Contenu>>;
/** Modifications en attente (index ou espace de travail) : null = fichier supprimé. */
export type Modifs = Readonly<Record<string, Contenu | null>>;

export interface Commit {
  id: string;
  message: string;
  parents: readonly string[];
  /** Colonne d'origine dans le graphe. */
  branche: string;
  auteur: string;
  arbre: Arbre;
  /** Ordre de création (0 = le plus ancien). */
  seq: number;
  type?: 'revert';
  annule?: string;
}

export type Head = { type: 'branche'; nom: string } | { type: 'commit'; id: string };

export interface EtatBisect {
  /** HEAD d'origine, restauré par « git bisect reset ». */
  origine: Head;
  bons: string | null;
  goods: readonly string[];
  /** Commit courant à tester. */
  courant: string | null;
  resultat: string | null;
}

export type Segment =
  { ok: readonly string[] } | { conflit: { ours: readonly string[]; theirs: readonly string[] } };
export type Choix = 'mienne' | 'autre' | 'deux';

export interface EtatFusion {
  /** Branche qui reçoit la fusion. */
  cible: string;
  /** Branche fusionnée. */
  avec: string;
  autreId: string;
  /** Segments de chaque fichier en conflit, pour la résolution bloc par bloc. */
  fichiers: Readonly<Record<string, readonly Segment[]>>;
}

export interface Testeur {
  commande: string;
  fautif: string;
  sortieOk: string;
  sortieKo: string;
}

export interface Depot {
  commits: Readonly<Record<string, Commit>>;
  /** Nom de branche → id du commit pointé. */
  branches: Readonly<Record<string, string>>;
  /** Ordre des colonnes du graphe. */
  ordreBranches: readonly string[];
  /** Pointes et ancêtres au départ, pour pointeInchangee et historiqueIntact. */
  pointesInitiales: Readonly<Record<string, string>>;
  ancetresInitiaux: Readonly<Record<string, readonly string[]>>;
  tags: Readonly<Record<string, string>>;
  head: Head;
  /** Modifications de l'espace de travail, non indexées. */
  travail: Modifs;
  /** Modifications indexées (git add), par rapport au HEAD. */
  index: Modifs;
  prochainsHash: readonly string[];
  bisect: EtatBisect | null;
  fusion: EtatFusion | null;
  testeur: Testeur | null;
}

/** Forme d'un commit dans une fiche de mission (design/missions/schema.ts). */
export interface FicheCommit {
  id: string;
  message: string;
  branche: string;
  parents: string[];
  auteur?: string;
  fichiers?: Record<string, string[]>;
  supprimes?: string[];
  type?: 'revert';
  annule?: string;
}

/** Forme du dépôt d'une fiche de mission. */
export interface FicheDepot {
  branches: { nom: string; pointe: string }[];
  commits: FicheCommit[];
  head: { branche: string } | { commit: string };
  tags?: { nom: string; commit: string }[];
  travail?: Record<string, string[]>;
  prochainsHash?: string[];
  testeur?: Testeur;
}

export type Evenement =
  | { type: 'commitCree'; id: string; branche: string; parents: readonly string[]; annule?: string }
  | { type: 'headDeplace'; de: string | null; vers: string }
  | { type: 'brancheCreee'; nom: string }
  | { type: 'brancheSupprimee'; nom: string }
  | { type: 'fusion'; branche: string; avec: string; rapide: boolean }
  | { type: 'conflit'; fichier: string }
  | { type: 'bisectEtape'; commit: string; verdict: 'bon' | 'mauvais' | 'test' }
  | { type: 'revert'; id: string; annule: string };

export type CodeErreur =
  | 'commande-inconnue'
  | 'commande-hors-git'
  | 'revision-invalide'
  | 'reference-invalide'
  | 'pathspec'
  | 'merge-inconnu'
  | 'rien-a-valider'
  | 'branche-existe'
  | 'branche-introuvable'
  | 'branche-courante'
  | 'branche-non-fusionnee'
  | 'conflits-non-resolus'
  | 'modifs-ecrasees'
  | 'pas-de-fusion'
  | 'tag-existe'
  | 'arguments'
  | 'usage';

export interface ErreurGit {
  code: CodeErreur;
  /** Lignes exactes écrites par Git sur la sortie d'erreur. */
  texte: string[];
  /** Explication pédagogique en français, pour le bandeau rouge. */
  explication: string;
}

export interface ResultatCommande {
  depot: Depot;
  sortie: string[];
  erreur?: ErreurGit;
  evenements: Evenement[];
}

export interface ResultatExecution extends ResultatCommande {
  /** False pour « clear » et « git help », exclus du compteur de commandes. */
  compte: boolean;
}
