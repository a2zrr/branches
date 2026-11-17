// =============================================================================
// Branchés — format des données (à copier dans src/game/types.ts et à valider avec zod)
// Une mission = un fichier JSON dans missions/. Ajouter une mission = ajouter un fichier.
// =============================================================================

export type IdCommit = string; // 7 caractères hexadécimaux, ex. "a3f9c2e"

export interface Chapitre {
  numero: number;
  titre: string;
  sousTitre: string;
  couleur?: string; // fond de l'en-tête quand le chapitre est ouvert (texte blanc dessus)
  couleurArete?: string; // bord 3D de l'en-tête
  bientot?: boolean; // chapitre annoncé, sans mission (bordure en pointillés)
}

export interface CommitDepot {
  id: IdCommit;
  message: string;
  branche: string; // colonne d'origine dans le graphe
  parents: IdCommit[]; // [] racine, [p] normal, [p1, p2] fusion
  auteur?: string; // "Toi" par défaut
  fichiers?: Record<string, string[]>; // contenu COMPLET (lignes) des fichiers créés/modifiés par ce commit
  supprimes?: string[]; // fichiers supprimés par ce commit
  type?: 'revert'; // posé par le moteur quand il crée un revert
  annule?: IdCommit; // id du commit annulé (revert)
}

export interface Testeur {
  // Commande propre à une mission (ex. bisect) : affiche sortieOk si HEAD ne contient pas
  // le commit fautif, sortieKo sinon.
  commande: string; // ex. "npm run test:prix"
  fautif: IdCommit;
  sortieOk: string;
  sortieKo: string;
}

export interface Depot {
  branches: { nom: string; pointe: IdCommit }[]; // ordre = ordre des colonnes du graphe
  commits: CommitDepot[]; // du plus ancien au plus récent
  head: { branche: string } | { commit: IdCommit };
  tags?: { nom: string; commit: IdCommit }[];
  travail?: Record<string, string[]>; // fichiers modifiés NON commités (contenu complet)
  prochainsHash?: IdCommit[]; // hash imposés aux prochains commits créés (maquettes, tests)
  testeur?: Testeur;
}

// Conditions de réussite : TOUTES doivent être vraies quand le joueur clique sur VÉRIFIER.
// « message » s'affiche dans le bandeau rouge si la condition est fausse.
export type Condition =
  | { type: 'commitAnnule'; cible: IdCommit; branche: string; message: string } // un commit de revert de « cible » est sur la branche
  | { type: 'historiqueIntact'; branche: string; message: string } // tous les commits initiaux de la branche sont encore ses ancêtres
  | { type: 'pointeInchangee'; branche: string; message: string } // la branche pointe toujours au même commit qu'au départ
  | { type: 'brancheExiste'; nom: string; message: string }
  | { type: 'headSur'; branche: string; message: string }
  | { type: 'headDetacheSur'; commit: IdCommit; message: string }
  | { type: 'commitsDepuis'; branche: string; depuis: IdCommit; min: number; message: string }
  | { type: 'contient'; branche: string; commit: IdCommit; message: string } // commit est ancêtre de la pointe de la branche
  | { type: 'fusionTerminee'; branche: string; avec: string; message: string } // pointe = commit à 2 parents qui contient « avec »
  | { type: 'aucunConflit'; message: string }
  | { type: 'bisectTrouve'; commit: IdCommit; message: string }
  | { type: 'fichierContient'; fichier: string; ligne: string; branche: string; message: string }
  | { type: 'fichierPropre'; message: string }; // aucune modification en attente

export type TypeExercice = 'terminal-graphe' | 'conflit'; // extensible : "qcm", …

export type Choix = 'mienne' | 'autre' | 'deux';

export interface ExerciceConflit {
  commandeDeDepart: string; // exécutée automatiquement au chargement, ex. "git merge feature/paiement"
  fichier: string; // fichier en conflit à afficher
  choixAcceptes: Choix[];
  reactions: Record<Choix, string>; // phrase affichée selon le choix
}

interface MissionBase {
  id: string; // "c1-m4"
  chapitre: number;
  ordre: number;
  titre: string;
  notion: string; // ce que la mission enseigne → « Ton Git » et badges
}

export interface MissionJouable extends MissionBase {
  type: TypeExercice;
  histoire: string; // réplique de Hédi au début (expression « panique »)
  objectif: string;
  depot: Depot;
  indices: string[]; // révélés un par un
  reussite: Condition[];
  optimal: number; // commandes (terminal) ou validations (conflit)
  appris: string[]; // « Ce que tu as appris »
  solution: string[]; // JAMAIS affichée : référence pour les tests. Conflit : ["choix:mienne"]
  exercice?: ExerciceConflit; // requis si type = "conflit"
}

export interface MissionBrouillon extends MissionBase {
  brouillon: true; // visible sur la carte, toujours verrouillée (« bientôt »)
  histoire?: string;
  objectif?: string;
}

export type Mission = MissionJouable | MissionBrouillon;

export interface Badge {
  id: string;
  nom: string;
  notion: string; // débloqué quand cette notion est maîtrisée
  couleur: string;
  couleurArete: string;
  icone: string; // chemin SVG (grille 24, trait 2,8, blanc)
}

// Une fiche qui contient la clé "aCompleter" n'est pas finie :
// l'étape 5 du prompt la termine, et un test échoue tant qu'il en reste une.
