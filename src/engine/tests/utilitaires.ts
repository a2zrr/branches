import { creerDepot } from '../depot';
import { executer } from '../executer';
import type { Depot, FicheDepot, ResultatExecution } from '../types';

export function depotDe(fiche: { depot: unknown }): Depot {
  return creerDepot(fiche.depot as FicheDepot);
}

/** Exécute plusieurs lignes à la suite et renvoie tous les résultats. */
export function jouer(depot: Depot, lignes: string[]): { depot: Depot; resultats: ResultatExecution[] } {
  const resultats: ResultatExecution[] = [];
  let courant = depot;
  for (const ligne of lignes) {
    const r = executer(courant, ligne);
    resultats.push(r);
    courant = r.depot;
  }
  return { depot: courant, resultats };
}

/** Sorties concaténées (utile pour les comparaisons golden). */
export function sortieDe(depot: Depot, ligne: string): string[] {
  return executer(depot, ligne).sortie;
}

/** Gèle récursivement un objet (pour vérifier que le moteur ne modifie rien). */
export function gelerProfond<T>(objet: T): T {
  if (objet !== null && typeof objet === 'object') {
    for (const v of Object.values(objet as Record<string, unknown>)) gelerProfond(v);
    Object.freeze(objet);
  }
  return objet;
}
