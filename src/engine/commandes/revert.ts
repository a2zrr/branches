import { arbreHead, idHead, resoudre } from '../depot';
import { fichiersModifies } from '../diff';
import { erreur } from '../erreurs';
import type { Arbre, Contenu, Depot, ResultatCommande } from '../types';
import { creerCommit, ok, resumeCommit } from './commun';

/** git revert <ref> : nouveau commit qui fait l'inverse du commit visé. */
export function annuler(depot: Depot, args: string[]): ResultatCommande {
  const ref = args[0];
  if (ref === undefined) {
    return { ...ok(depot), erreur: erreur('arguments', ['error: revert requires a commit'], 'revert') };
  }
  const cible = resoudre(depot, ref);
  if (cible === null || depot.commits[cible] === undefined) {
    return { ...ok(depot), erreur: erreur('revision-invalide', [`fatal: bad revision '${ref}'`], ref) };
  }
  if (Object.keys(depot.index).length > 0 || Object.keys(depot.travail).length > 0) {
    return {
      ...ok(depot),
      erreur: erreur('modifs-ecrasees', ['error: your local changes would be overwritten by revert.'], ref),
    };
  }
  const visee = depot.commits[cible];
  const parent = visee.parents.length > 0 ? visee.parents[0] : undefined;
  const avantVisee: Arbre = parent === undefined ? {} : (depot.commits[parent]?.arbre ?? {});
  const actuel = arbreHead(depot);
  const nouveau: Record<string, Contenu> = { ...actuel };
  for (const f of fichiersModifies(avantVisee, visee.arbre)) {
    const d = avantVisee[f.chemin];
    if (d === undefined) delete nouveau[f.chemin];
    else nouveau[f.chemin] = d;
  }

  const cree = creerCommit(depot, {
    message: `Revert "${visee.message}"`,
    parents: [idHead(depot)],
    arbre: nouveau,
    annule: cible,
    type: 'revert',
  });
  return {
    depot: cree.depot,
    sortie: resumeCommit(depot, cree.commit, actuel),
    evenements: [...cree.evenements, { type: 'revert', id: cree.commit.id, annule: cible }],
  };
}
