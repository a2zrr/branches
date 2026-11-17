import { arbreHead, contenuTravail, idHead } from '../depot';
import type { Depot, ResultatCommande } from '../types';
import { ok } from './commun';

export function statut(depot: Depot): ResultatCommande {
  const tete =
    depot.head.type === 'branche' ? `On branch ${depot.head.nom}` : `HEAD detached at ${idHead(depot)}`;
  const arbre = arbreHead(depot);
  const lignes: string[] = [tete];

  if (depot.fusion !== null) {
    lignes.push(
      'You have unmerged paths.',
      '  (fix conflicts and run "git commit")',
      '  (use "git merge --abort" to abort the merge)',
      '',
    );
    const nonResolus = Object.keys(depot.fusion.fichiers).filter((f) => !(f in depot.index));
    if (nonResolus.length > 0) {
      lignes.push('Unmerged paths:', '  (use "git add <file>..." to mark resolution)');
      for (const f of nonResolus) lignes.push(`\tboth modified:   ${f}`);
      lignes.push('');
    }
  }

  const indexes = Object.keys(depot.index)
    .sort()
    .flatMap((chemin) => {
      const contenu = depot.index[chemin] ?? null;
      const avant = arbre[chemin];
      if (contenu === null) return avant !== undefined ? [`\tdeleted:    ${chemin}`] : [];
      if (avant === undefined) return [`\tnew file:   ${chemin}`];
      return [`\tmodified:   ${chemin}`];
    });
  if (indexes.length > 0) {
    lignes.push(
      'Changes to be committed:',
      '  (use "git restore --staged <file>..." to unstage)',
      ...indexes,
      '',
    );
  }

  const modifies = Object.keys(depot.travail)
    .sort()
    .filter(
      (c) =>
        (c in arbre || c in depot.index) && !(depot.fusion?.fichiers[c] !== undefined && !(c in depot.index)),
    )
    .flatMap((chemin) => {
      const courant = contenuTravail(depot, chemin);
      const base = chemin in depot.index ? (depot.index[chemin] ?? null) : (arbre[chemin] ?? null);
      if (courant === null) return base !== null ? [`\tdeleted:    ${chemin}`] : [];
      if (base === null) return [];
      return [`\tmodified:   ${chemin}`];
    });
  const nouveaux = Object.keys(depot.travail)
    .sort()
    .filter((c) => !(c in arbre) && !(c in depot.index) && depot.travail[c] !== null);

  if (modifies.length > 0) {
    lignes.push(
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
      ...modifies,
      '',
    );
  }
  if (nouveaux.length > 0) {
    lignes.push('Untracked files:', '  (use "git add <file>..." to include in what will be committed)');
    for (const f of nouveaux) lignes.push(`\t${f}`);
    lignes.push('');
  }

  if (indexes.length === 0 && modifies.length === 0 && nouveaux.length === 0 && depot.fusion === null) {
    lignes.push('nothing to commit, working tree clean');
  } else if (indexes.length === 0 && depot.fusion === null) {
    if (modifies.length > 0) {
      lignes.push('no changes added to commit (use "git add" and/or "git commit -a")');
    } else {
      lignes.push('nothing added to commit but untracked files present (use "git add" to track)');
    }
  }

  return ok(depot, lignes);
}
