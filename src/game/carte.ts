// Carte des missions : quels chapitres sont visibles, et ce que dit le mur de nuages (spec § 9 bis).
// Fonctions pures : aucun import de React, de Zustand ni du DOM.
import type { ChapitreValide, MissionJouableValidee, MissionValidee } from './schemas';
import { estJouable, type Progression } from './regles';

/** Espace insécable : on l'écrit en clair pour qu'elle ne disparaisse pas à la relecture. */
const NBSP = ' ';

export interface AvancementChapitre {
  faites: number;
  total: number;
}

export type MurDeNuages =
  | {
      /** Le chapitre suivant n'est pas encore ouvert : on attend la fin du précédent. */
      variante: 'cache';
      numero: number;
      precedent: number;
      texte: string;
      avancement: AvancementChapitre;
    }
  | {
      /** Ouvert mais sans mission jouable, ou plus de chapitre : « La suite se prépare ». */
      variante: 'bientot';
      numero: number;
      sousTitre: string;
    };

export interface VueCarte {
  /** Chapitres visibles, dans l'ordre du jeu. */
  chapitres: ChapitreValide[];
  /** Missions des chapitres visibles seulement : aucune mission d'un chapitre caché. */
  missions: MissionValidee[];
  /** Le mur qui suit le dernier chapitre visible. Après lui, rien. */
  mur: MurDeNuages;
  /** Le plus haut chapitre visible pas encore découvert, s'il y en a un. */
  aDecouvrir: number | null;
}

const SOUS_TITRE_PAR_DEFAUT = `Hédi prépare les prochaines missions. Reviens bientôt${NBSP}!`;

function jouablesDuChapitre(missions: MissionValidee[], numero: number): MissionJouableValidee[] {
  return missions.filter((m): m is MissionJouableValidee => m.chapitre === numero && estJouable(m));
}

/** Un chapitre est fini quand toutes ses missions jouables sont réussies (et qu'il en a au moins une). */
function estFini(missions: MissionValidee[], progression: Progression, numero: number): boolean {
  const jouables = jouablesDuChapitre(missions, numero);
  return jouables.length > 0 && jouables.every((m) => progression[m.id]?.reussie === true);
}

function avancementDuChapitre(
  missions: MissionValidee[],
  progression: Progression,
  numero: number,
): AvancementChapitre {
  const jouables = jouablesDuChapitre(missions, numero);
  return {
    faites: jouables.filter((m) => progression[m.id]?.reussie === true).length,
    total: jouables.length,
  };
}

/** « Termine la mission du chapitre 2 » ou « Termine les 6 missions du chapitre 1 ». */
function texteDuMur(total: number, precedent: number): string {
  const objet = total === 1 ? `la mission du chapitre ${precedent}` : `les ${total} missions du chapitre ${precedent}`;
  return `Termine ${objet} pour les dissiper.`;
}

/**
 * Ce qu'on voit et ce qu'on cache.
 * - Le chapitre 1 est toujours visible (s'il a une mission jouable).
 * - Le chapitre N+1 est visible si le chapitre N est fini et si N+1 a au moins une mission jouable.
 * - Le premier chapitre qui ne s'affiche pas devient le mur. Les chapitres suivants ne sont pas renvoyés.
 * `decouverts` : chapitres déjà montrés avec leur animation (store `chapitresDecouverts`).
 */
export function chapitresVisibles(
  chapitres: ChapitreValide[],
  missions: MissionValidee[],
  progression: Progression,
  decouverts: readonly number[] = [],
): VueCarte {
  const ordre = [...chapitres].filter((c) => c.bientot !== true).sort((a, b) => a.numero - b.numero);
  const annonces = chapitres.filter((c) => c.bientot === true);

  const visibles: ChapitreValide[] = [];
  let precedent: ChapitreValide | undefined;
  let mur: MurDeNuages | null = null;

  for (const chapitre of ordre) {
    const ouvert = precedent === undefined || estFini(missions, progression, precedent.numero);
    const aDesMissions = jouablesDuChapitre(missions, chapitre.numero).length > 0;
    if (ouvert && aDesMissions) {
      visibles.push(chapitre);
      precedent = chapitre;
      continue;
    }
    mur =
      precedent !== undefined && !ouvert
        ? {
            variante: 'cache',
            numero: chapitre.numero,
            precedent: precedent.numero,
            texte: texteDuMur(avancementDuChapitre(missions, progression, precedent.numero).total, precedent.numero),
            avancement: avancementDuChapitre(missions, progression, precedent.numero),
          }
        : {
            variante: 'bientot',
            numero: chapitre.numero,
            sousTitre: annonces[0]?.sousTitre ?? SOUS_TITRE_PAR_DEFAUT,
          };
    break;
  }

  // Tous les chapitres sont visibles : le mur annonce simplement la suite.
  mur ??= {
    variante: 'bientot',
    numero: (precedent?.numero ?? 0) + 1,
    sousTitre: annonces[0]?.sousTitre ?? SOUS_TITRE_PAR_DEFAUT,
  };

  const numeros = new Set(visibles.map((c) => c.numero));
  const nonDecouverts = visibles.filter((c) => !decouverts.includes(c.numero));
  const aDecouvrir = nonDecouverts.length > 0 ? Math.max(...nonDecouverts.map((c) => c.numero)) : null;

  return {
    chapitres: visibles,
    missions: missions.filter((m) => numeros.has(m.chapitre)),
    mur,
    aDecouvrir,
  };
}
