import { arbreHead, idHead, nouvelId, normaliser } from '../depot';
import { fichiersModifies, modesFichiers, resume, statsFichier, type FichierModifie } from '../diff';
import type { Arbre, Commit, Depot, Evenement, Head, ResultatCommande } from '../types';

export function ok(depot: Depot, sortie: string[] = [], evenements: Evenement[] = []): ResultatCommande {
  return { depot, sortie, evenements };
}

export function brancheHead(depot: Depot): string | null {
  return depot.head.type === 'branche' ? depot.head.nom : null;
}

export function commitHead(depot: Depot): Commit {
  const c = depot.commits[idHead(depot)];
  if (c === undefined) throw new Error('Commit HEAD introuvable');
  return c;
}

/** Arbre de l'index : arbre du HEAD avec les modifications indexées. */
export function arbreIndex(depot: Depot): Arbre {
  const arbre: Record<string, readonly string[]> = { ...arbreHead(depot) };
  for (const [chemin, contenu] of Object.entries(depot.index)) {
    if (contenu === null) delete arbre[chemin];
    else arbre[chemin] = contenu;
  }
  return arbre;
}

/** Déplace HEAD : la branche courante avance, ou HEAD se détache sur le commit. */
export function deplacerHead(depot: Depot, id: string): { depot: Depot; evenement: Evenement } {
  const de = idHead(depot);
  const nouveau: Depot =
    depot.head.type === 'branche'
      ? { ...depot, branches: { ...depot.branches, [depot.head.nom]: id } }
      : { ...depot, head: { type: 'commit', id } };
  return { depot: nouveau, evenement: { type: 'headDeplace', de, vers: id } };
}

/** Crée un commit à partir d'un arbre, fait avancer HEAD et vide l'index. */
export function creerCommit(
  depot: Depot,
  opts: { message: string; parents: readonly string[]; arbre: Arbre; annule?: string; type?: 'revert' },
): { depot: Depot; commit: Commit; evenements: Evenement[] } {
  const { id, depot: avecId } = nouvelId(depot, opts.message, opts.parents);
  const seq = Object.values(avecId.commits).reduce((m, c) => Math.max(m, c.seq), -1) + 1;
  const parent = opts.parents[0];
  const brancheParent = parent !== undefined ? avecId.commits[parent]?.branche : undefined;
  const commit: Commit = {
    id,
    message: opts.message,
    parents: opts.parents,
    branche: brancheHead(avecId) ?? brancheParent ?? 'main',
    auteur: 'Toi',
    arbre: opts.arbre,
    seq,
    ...(opts.type !== undefined ? { type: opts.type } : {}),
    ...(opts.annule !== undefined ? { annule: opts.annule } : {}),
  };
  let suivant: Depot = { ...avecId, commits: { ...avecId.commits, [id]: commit }, index: {} };
  const deplace = deplacerHead(suivant, id);
  suivant = normaliser(deplace.depot);
  const evenements: Evenement[] = [
    {
      type: 'commitCree',
      id,
      branche: commit.branche,
      parents: opts.parents,
      ...(opts.annule ? { annule: opts.annule } : {}),
    },
    deplace.evenement,
  ];
  return { depot: suivant, commit, evenements };
}

/** Ligne « [main abc1234] message » et statistiques de l'arbre. */
export function resumeCommit(depot: Depot, commit: Commit, avant: Arbre): string[] {
  const titre = brancheHead(depot);
  const nom = titre === null ? `detached HEAD ${commit.id}` : `${titre} ${commit.id}`;
  const fichiers: FichierModifie[] = fichiersModifies(avant, commit.arbre);
  const lignes = [`[${nom}] ${commit.message}`];
  if (fichiers.length > 0) {
    lignes.push(resume(fichiers));
    lignes.push(...modesFichiers(fichiers));
  }
  return lignes;
}

export function statsFichiers(avant: Arbre, apres: Arbre): string[] {
  return fichiersModifies(avant, apres).map(statsFichier);
}

export function avecHead(depot: Depot, head: Head): Depot {
  return { ...depot, head };
}
