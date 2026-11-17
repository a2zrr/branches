// Règles du jeu (spec §11) : étoiles, XP, déblocage, notions « Ton Git », badges, progression.
import type { BadgeValide, MissionJouableValidee, MissionValidee } from './schemas';

export interface ResultatMission {
  etoiles: 0 | 1 | 2 | 3;
  commandes: number;
  reussie: boolean;
}

export type Progression = Record<string, ResultatMission>;
export type EtatMission = 'verrouillee' | 'disponible' | 'en-cours' | 'terminee';
export type EtatNotion = 'maitrisee' | 'en-cours' | 'a-decouvrir';

export const XP_PAR_ETOILE = 10;

/** Commandes ≤ optimal → 3 étoiles ; ≤ optimal + 2 → 2 ; sinon 1. */
export function etoilesPour(commandes: number, optimal: number): 1 | 2 | 3 {
  if (commandes <= optimal) return 3;
  if (commandes <= optimal + 2) return 2;
  return 1;
}

export function xpPour(etoiles: number): number {
  return etoiles * XP_PAR_ETOILE;
}

export function estJouable(m: MissionValidee): m is MissionJouableValidee {
  return !('brouillon' in m);
}

/**
 * Meilleure note : jamais une baisse. À étoiles égales, on garde le moindre nombre de commandes.
 */
export function meilleureNote(
  actuelle: ResultatMission | undefined,
  nouvelle: ResultatMission,
): ResultatMission {
  if (actuelle === undefined) return nouvelle;
  if (nouvelle.etoiles > actuelle.etoiles) return nouvelle;
  if (nouvelle.etoiles === actuelle.etoiles && nouvelle.commandes < actuelle.commandes) return nouvelle;
  return { ...actuelle, reussie: actuelle.reussie || nouvelle.reussie };
}

/** XP total = somme des étoiles × 10 de la meilleure note de chaque mission. */
export function xpTotal(progression: Progression): number {
  return Object.values(progression).reduce((somme, r) => somme + xpPour(r.etoiles), 0);
}

/**
 * États des missions. Déblocage dans l'ordre du jeu : la mission suivante s'ouvre quand la précédente
 * est réussie. Les brouillons restent verrouillés et sont sautés. En mode débogage, tout est jouable.
 */
export function etatsMissions(
  missions: MissionValidee[],
  progression: Progression,
  debug = false,
): Record<string, EtatMission> {
  const etats: Record<string, EtatMission> = {};
  let enCoursAttribuee = false;
  for (const m of missions) {
    if (!estJouable(m)) {
      etats[m.id] = 'verrouillee';
      continue;
    }
    const faite = progression[m.id]?.reussie === true;
    if (faite) {
      etats[m.id] = 'terminee';
    } else if (debug) {
      etats[m.id] = enCoursAttribuee ? 'disponible' : 'en-cours';
      enCoursAttribuee = true;
    } else if (!enCoursAttribuee) {
      etats[m.id] = 'en-cours';
      enCoursAttribuee = true;
    } else {
      etats[m.id] = 'verrouillee';
    }
  }
  return etats;
}

/** Première mission jouable non terminée (ou null si tout est fini). */
export function missionEnCours(missions: MissionValidee[], progression: Progression): MissionValidee | null {
  const etats = etatsMissions(missions, progression);
  return missions.find((m) => etats[m.id] === 'en-cours') ?? null;
}

/** « Ton Git » : notions uniques dans l'ordre du jeu. Maîtrisée si une mission de cette notion est réussie. */
export function notionsTonGit(
  missions: MissionValidee[],
  progression: Progression,
  enCours: MissionValidee | null,
): { nom: string; etat: EtatNotion }[] {
  const ordre: string[] = [];
  for (const m of missions) if (!ordre.includes(m.notion)) ordre.push(m.notion);
  return ordre.map((nom) => {
    const maitrisee = missions.some((m) => m.notion === nom && progression[m.id]?.reussie === true);
    if (maitrisee) return { nom, etat: 'maitrisee' };
    if (enCours?.notion === nom) return { nom, etat: 'en-cours' };
    return { nom, etat: 'a-decouvrir' };
  });
}

/** Badges débloqués : ceux dont la notion est maîtrisée. */
export function badgesDebloques(
  badges: BadgeValide[],
  notions: { nom: string; etat: EtatNotion }[],
): Set<string> {
  const maitrisees = new Set(notions.filter((n) => n.etat === 'maitrisee').map((n) => n.nom));
  return new Set(badges.filter((b) => maitrisees.has(b.notion)).map((b) => b.id));
}

export function progressionChapitre(
  missions: MissionValidee[],
  chapitre: number,
  progression: Progression,
): { faites: number; total: number; etoiles: number } {
  const jouables = missions.filter((m) => m.chapitre === chapitre && estJouable(m));
  return {
    faites: jouables.filter((m) => progression[m.id]?.reussie === true).length,
    total: jouables.length,
    etoiles: jouables.reduce((s, m) => s + (progression[m.id]?.etoiles ?? 0), 0),
  };
}
