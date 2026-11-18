// Progression persistée dans le navigateur (localStorage, clé « branches:v1 »). Aucun compte, aucun serveur.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { meilleureNote, xpTotal, type Progression, type ResultatMission, etoilesPour } from './regles';
import { CHAPITRES, MISSIONS, trouverMission } from './missions';
import { chapitresVisibles } from './carte';

export type Theme = 'clair' | 'sombre' | 'auto';

export const CLE_STOCKAGE = 'branches:v1';
export const VERSION_STOCKAGE = 3;

export interface ProgressionState {
  theme: Theme;
  progression: Progression;
  xp: number;
  /** Chapitres déjà montrés sur la carte (animation des nuages jouée une fois). Commence à [1]. */
  chapitresDecouverts: number[];
  /** Mode débogage (?debug=1) : toutes les missions jouables pour la session, jamais enregistré. */
  debug: boolean;
  definirTheme: (theme: Theme) => void;
  terminerMission: (id: string, commandes: number) => ResultatMission | null;
  marquerDecouverts: (numeros: number[]) => void;
  exporter: () => string;
  importer: (texte: string) => { ok: true } | { ok: false; message: string };
  reinitialiser: () => void;
}

const SchemaResultat = z.object({
  etoiles: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  commandes: z.number().int().nonnegative(),
  reussie: z.boolean(),
});

/** Chapitres qui sont visibles pour une progression donnée : ils sont tous « découverts ». */
export function chapitresVisiblesPour(progression: Progression): number[] {
  return chapitresVisibles(CHAPITRES, MISSIONS, progression).chapitres.map((c) => c.numero);
}

const SchemaSauvegarde = z.object({
  format: z.literal('branches-progression'),
  version: z.literal(1),
  theme: z.enum(['clair', 'sombre', 'auto']),
  progression: z.record(z.string(), SchemaResultat),
});

/** Thème lu depuis une sauvegarde : « clair » par défaut ; « auto » suit le système. */
function lireTheme(valeur: unknown): Theme {
  return valeur === 'sombre' || valeur === 'auto' ? valeur : 'clair';
}

/**
 * Migration : version 0 = { progression: { id: étoiles } } ; version 1 = progression détaillée ;
 * version 2 = + chapitres découverts. Depuis une version antérieure, tous les chapitres déjà visibles
 * sont marqués découverts, sans animation.
 */
export function migrer(persiste: unknown, version: number): Partial<ProgressionState> {
  const brut = (persiste ?? {}) as Record<string, unknown>;
  if (version < 1) {
    const ancienne = (brut['progression'] ?? {}) as Record<string, unknown>;
    const progression: Progression = {};
    for (const [id, valeur] of Object.entries(ancienne)) {
      const etoiles = typeof valeur === 'number' ? Math.min(3, Math.max(0, Math.round(valeur))) : 0;
      if (etoiles > 0) {
        progression[id] = { etoiles: etoiles as 1 | 2 | 3, commandes: 0, reussie: true };
      }
    }
    return {
      theme: lireTheme(brut['theme']),
      progression,
      xp: xpTotal(progression),
      chapitresDecouverts: chapitresVisiblesPour(progression),
    };
  }
  const progression = (brut['progression'] ?? {}) as Progression;
  const decouverts = brut['chapitresDecouverts'];
  return {
    theme: lireTheme(brut['theme']),
    progression,
    xp: xpTotal(progression),
    chapitresDecouverts:
      version < 2 || !Array.isArray(decouverts)
        ? chapitresVisiblesPour(progression)
        : decouverts.filter((n): n is number => typeof n === 'number'),
  };
}

function debugDemande(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

export const useProgression = create<ProgressionState>()(
  persist(
    (set, get) => ({
      theme: 'clair',
      progression: {},
      xp: 0,
      chapitresDecouverts: [1],
      debug: debugDemande(),
      definirTheme: (theme) => {
        set({ theme });
      },
      terminerMission: (id, commandes) => {
        const mission = trouverMission(id);
        if (mission === undefined || !('reussite' in mission)) return null;
        const nouvelle: ResultatMission = {
          etoiles: etoilesPour(commandes, mission.optimal),
          commandes,
          reussie: true,
        };
        const progression = {
          ...get().progression,
          [id]: meilleureNote(get().progression[id], nouvelle),
        };
        set({ progression, xp: xpTotal(progression) });
        return progression[id] ?? null;
      },
      marquerDecouverts: (numeros) => {
        const tous = new Set([...get().chapitresDecouverts, ...numeros]);
        set({ chapitresDecouverts: [...tous].sort((a, b) => a - b) });
      },
      exporter: () => {
        const { theme, progression } = get();
        return JSON.stringify({ format: 'branches-progression', version: 1, theme, progression }, null, 2);
      },
      importer: (texte) => {
        let brut: unknown;
        try {
          brut = JSON.parse(texte);
        } catch {
          return {
            ok: false,
            message: 'Ce fichier n’est pas un JSON valide. Ta partie n’a pas été modifiée.',
          };
        }
        const r = SchemaSauvegarde.safeParse(brut);
        if (!r.success) {
          return {
            ok: false,
            message:
              'Ce fichier ne ressemble pas à une sauvegarde de Branchés. Ta partie n’a pas été modifiée.',
          };
        }
        const progression = r.data.progression as Progression;
        set({
          theme: r.data.theme,
          progression,
          xp: xpTotal(progression),
          chapitresDecouverts: chapitresVisiblesPour(progression),
        });
        return { ok: true };
      },
      reinitialiser: () => {
        set({ progression: {}, xp: 0, chapitresDecouverts: [1] });
      },
    }),
    {
      name: CLE_STOCKAGE,
      version: VERSION_STOCKAGE,
      migrate: (persiste, version) => ({ ...migrer(persiste, version) }) as ProgressionState,
      partialize: (etat) => ({
        theme: etat.theme,
        progression: etat.progression,
        xp: etat.xp,
        chapitresDecouverts: etat.chapitresDecouverts,
      }),
    },
  ),
);
