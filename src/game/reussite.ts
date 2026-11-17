// Évaluation des conditions de réussite (spec §11 et schema.ts), sur le dépôt courant du moteur.
import { ancestres, resoudre } from '../engine/depot';
import { marqueursRestants } from '../engine/commandes/fusion';
import type { Condition } from './types';
import type { Depot } from '../engine/types';

export interface ResultatReussite {
  ok: boolean;
  messageDuPremierEchec?: string;
}

function tip(depot: Depot, branche: string): string | undefined {
  return depot.branches[branche];
}

/** Évalue une condition sur le dépôt. */
export function evaluerCondition(depot: Depot, c: Condition): boolean {
  switch (c.type) {
    case 'commitAnnule': {
      const pointe = tip(depot, c.branche);
      if (pointe === undefined) return false;
      const ids = ancestres(depot.commits, pointe);
      return [...ids].some(
        (id) => depot.commits[id]?.type === 'revert' && depot.commits[id].annule === c.cible,
      );
    }
    case 'historiqueIntact': {
      const pointe = tip(depot, c.branche);
      if (pointe === undefined) return false;
      const ids = ancestres(depot.commits, pointe);
      return (depot.ancetresInitiaux[c.branche] ?? []).every((id) => ids.has(id));
    }
    case 'pointeInchangee':
      return (
        tip(depot, c.branche) !== undefined && tip(depot, c.branche) === depot.pointesInitiales[c.branche]
      );
    case 'brancheExiste':
      return c.nom in depot.branches;
    case 'headSur':
      return depot.head.type === 'branche' && depot.head.nom === c.branche;
    case 'headDetacheSur':
      return depot.head.type === 'commit' && depot.head.id === resoudre(depot, c.commit);
    case 'commitsDepuis': {
      const pointe = tip(depot, c.branche);
      const depuis = resoudre(depot, c.depuis);
      if (pointe === undefined || depuis === null) return false;
      const nouveaux = [...ancestres(depot.commits, pointe)].filter(
        (id) => !ancestres(depot.commits, depuis).has(id),
      );
      return nouveaux.length >= c.min;
    }
    case 'contient': {
      const pointe = tip(depot, c.branche);
      return pointe !== undefined && ancestres(depot.commits, pointe).has(c.commit);
    }
    case 'fusionTerminee': {
      const pointe = tip(depot, c.branche);
      const avec = tip(depot, c.avec);
      if (pointe === undefined || avec === undefined) return false;
      const commit = depot.commits[pointe];
      return (
        commit !== undefined && commit.parents.length === 2 && ancestres(depot.commits, pointe).has(avec)
      );
    }
    case 'aucunConflit':
      return !marqueursRestants(depot);
    case 'bisectTrouve':
      return depot.bisect?.resultat === c.commit;
    case 'fichierContient': {
      const pointe = tip(depot, c.branche);
      if (pointe === undefined) return false;
      return (depot.commits[pointe]?.arbre[c.fichier] ?? []).includes(c.ligne);
    }
    case 'fichierPropre':
      return Object.keys(depot.travail).length === 0 && Object.keys(depot.index).length === 0;
  }
}

/** Toutes les conditions doivent être vraies. Renvoie le message de la première fausse. */
export function evaluerReussite(depot: Depot, conditions: Condition[]): ResultatReussite {
  for (const c of conditions) {
    if (!evaluerCondition(depot, c)) return { ok: false, messageDuPremierEchec: c.message };
  }
  return { ok: true };
}
