import type { Depot } from '../../engine/types';
import type { DonneesGraphe, VueG } from './layout';

/** Transforme l'état du moteur en données du graphe (sans logique de rendu). */
export function depotVersGraphe(depot: Depot, vue: VueG = {}): DonneesGraphe {
  const commits = Object.values(depot.commits)
    .sort((a, b) => a.seq - b.seq)
    .map((c) => ({
      id: c.id,
      message: c.message,
      branche: c.branche,
      parents: c.parents,
      ...(c.type !== undefined ? { type: c.type } : {}),
      ...(c.annule !== undefined ? { annule: c.annule } : {}),
    }));
  const bisect = depot.bisect;
  const vueComplete: VueG = {
    ...vue,
    ...(bisect !== null
      ? {
          bisect: {
            bons: bisect.goods,
            mauvais: bisect.bons !== null ? [bisect.bons] : [],
            ...(bisect.courant !== null ? { test: bisect.courant } : {}),
          },
        }
      : {}),
  };
  return {
    branches: depot.ordreBranches.map((nom) => ({ nom, pointe: depot.branches[nom] ?? '' })),
    commits,
    head: depot.head.type === 'branche' ? { branche: depot.head.nom } : { commit: depot.head.id },
    tags: Object.entries(depot.tags).map(([nom, commit]) => ({ nom, commit })),
    vue: vueComplete,
  };
}
