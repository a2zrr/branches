// Chargement et validation des fiches (src/data/missions/*.json). Tout est piloté par les données.
import {
  SchemaBadge,
  SchemaChapitre,
  SchemaMission,
  type BadgeValide,
  type ChapitreValide,
  type MissionValidee,
} from './schemas';

const fichiers = import.meta.glob<unknown>('../data/missions/c*-m*.json', { eager: true, import: 'default' });
const fichiersChapitres = import.meta.glob<unknown>('../data/missions/chapitres.json', {
  eager: true,
  import: 'default',
});
const fichiersBadges = import.meta.glob<unknown>('../data/missions/badges.json', {
  eager: true,
  import: 'default',
});

function valider<T>(
  nom: string,
  schema: {
    safeParse: (
      v: unknown,
    ) =>
      | { success: true; data: T }
      | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
  },
  brut: unknown,
): T {
  const r = schema.safeParse(brut);
  if (!r.success) {
    const details = r.error.issues.map((i) => `${i.path.map(String).join('.')} : ${i.message}`).join(' ; ');
    throw new Error(`Fiche invalide (${nom}) : ${details}`);
  }
  return r.data;
}

/** Toutes les fiches valides, dans l'ordre du jeu (chapitre puis ordre). */
export const MISSIONS: MissionValidee[] = Object.entries(fichiers)
  .map(([chemin, brut]) => valider(chemin.split('/').pop() ?? chemin, SchemaMission, brut))
  .sort((a, b) => a.chapitre - b.chapitre || a.ordre - b.ordre);

export const CHAPITRES: ChapitreValide[] = Object.values(fichiersChapitres).flatMap((brut) =>
  (Array.isArray(brut) ? brut : []).map((c) => valider('chapitres.json', SchemaChapitre, c)),
);

export const BADGES: BadgeValide[] = Object.values(fichiersBadges).flatMap((brut) =>
  (Array.isArray(brut) ? brut : []).map((b) => valider('badges.json', SchemaBadge, b)),
);

export function trouverMission(id: string): MissionValidee | undefined {
  return MISSIONS.find((m) => m.id === id);
}
