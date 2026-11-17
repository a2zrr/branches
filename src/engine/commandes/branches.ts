import { ancestres, arbreHead, contenuTravail, idHead, normaliser, resoudre } from '../depot';
import type { Arbre, Depot, Evenement, ResultatCommande } from '../types';
import { erreur } from '../erreurs';
import { avecHead, ok } from './commun';

/** git branch [nom | -d nom] */
export function branche(depot: Depot, args: string[]): ResultatCommande {
  if (args.length === 0) {
    const courante = depot.head.type === 'branche' ? depot.head.nom : null;
    const lignes = [...Object.keys(depot.branches)]
      .sort()
      .map((nom) => `${nom === courante ? '*' : ' '} ${nom}`);
    return ok(depot, lignes);
  }
  if (args[0] === '-d' || args[0] === '-D') {
    const nom = args[1] ?? '';
    if (!(nom in depot.branches)) {
      return {
        ...ok(depot),
        erreur: erreur('branche-introuvable', [`error: branch '${nom}' not found.`], nom),
      };
    }
    if (depot.head.type === 'branche' && depot.head.nom === nom) {
      return {
        ...ok(depot),
        erreur: erreur(
          'branche-courante',
          [`error: Cannot delete branch '${nom}' checked out at '${depot.head.nom}'`],
          nom,
        ),
      };
    }
    const pointe = depot.branches[nom] ?? '';
    const fusionnee = ancestres(depot.commits, idHead(depot)).has(pointe);
    if (!fusionnee && args[0] === '-d') {
      return {
        ...ok(depot),
        erreur: erreur('branche-non-fusionnee', [`error: The branch '${nom}' is not fully merged.`], nom),
      };
    }
    const branches = { ...depot.branches };
    delete branches[nom];
    return {
      depot: { ...depot, branches, ordreBranches: depot.ordreBranches.filter((b) => b !== nom) },
      sortie: [`Deleted branch ${nom} (was ${pointe}).`],
      evenements: [{ type: 'brancheSupprimee', nom }],
    };
  }
  const nom = args[0] ?? '';
  if (nom in depot.branches) {
    return {
      ...ok(depot),
      erreur: erreur('branche-existe', [`fatal: a branch named '${nom}' already exists`], nom),
    };
  }
  return creerBranche(depot, nom, idHead(depot));
}

function creerBranche(depot: Depot, nom: string, pointe: string): ResultatCommande {
  const evenements: Evenement[] = [{ type: 'brancheCreee', nom }];
  return {
    depot: {
      ...depot,
      branches: { ...depot.branches, [nom]: pointe },
      ordreBranches: [...depot.ordreBranches, nom],
    },
    sortie: [],
    evenements,
  };
}

/** git tag [nom [ref]] */
export function tag(depot: Depot, args: string[]): ResultatCommande {
  if (args.length === 0) return ok(depot, Object.keys(depot.tags).sort());
  const nom = args[0] ?? '';
  if (nom in depot.tags) {
    return { ...ok(depot), erreur: erreur('tag-existe', [`fatal: tag '${nom}' already exists`], nom) };
  }
  const ref = args[1] ?? 'HEAD';
  const cible = resoudre(depot, ref);
  if (cible === null) {
    return {
      ...ok(depot),
      erreur: erreur('revision-invalide', [`fatal: Failed to resolve '${ref}' as a valid ref.`], ref),
    };
  }
  return ok({ ...depot, tags: { ...depot.tags, [nom]: cible } });
}

/** Vérifie que les modifications locales ne seraient pas écrasées par un changement vers `cible`. */
function conflitChangement(depot: Depot, cible: Arbre): string[] {
  const courant = arbreHead(depot);
  const bloquants: string[] = [];
  for (const chemin of [...Object.keys(depot.travail), ...Object.keys(depot.index)]) {
    const modifie = contenuTravail(depot, chemin);
    const dansCourant = courant[chemin];
    const dansCible = cible[chemin];
    const different = JSON.stringify(dansCourant ?? null) !== JSON.stringify(dansCible ?? null);
    const localementModifie = JSON.stringify(modifie ?? null) !== JSON.stringify(dansCourant ?? null);
    if (different && localementModifie) bloquants.push(chemin);
  }
  return bloquants.sort();
}

function refuserEcrasement(depot: Depot, fichiers: string[]): ResultatCommande {
  return {
    ...ok(depot),
    erreur: erreur(
      'modifs-ecrasees',
      [
        'error: Your local changes to the following files would be overwritten by checkout:',
        ...fichiers.map((f) => `\t${f}`),
        'Please commit your changes or stash them before you switch branches.',
        'Aborting',
      ],
      fichiers.join(', '),
    ),
  };
}

/** Bascule vers une branche existante. */
export function basculer(depot: Depot, nom: string): ResultatCommande {
  if (!(nom in depot.branches)) {
    return { ...ok(depot), erreur: erreur('reference-invalide', [`fatal: invalid reference: ${nom}`], nom) };
  }
  if (depot.head.type === 'branche' && depot.head.nom === nom) {
    return ok(depot, [`Already on '${nom}'`]);
  }
  const cible = depot.commits[depot.branches[nom] ?? ''];
  const bloquants = conflitChangement(depot, cible?.arbre ?? {});
  if (bloquants.length > 0) return refuserEcrasement(depot, bloquants);
  const de = idHead(depot);
  const suivant = normaliser(avecHead(depot, { type: 'branche', nom }));
  return {
    depot: suivant,
    sortie: [`Switched to branch '${nom}'`],
    evenements: [{ type: 'headDeplace', de, vers: idHead(suivant) }],
  };
}

/** git switch <branche> | -c <nouvelle> */
export function changer(depot: Depot, args: string[]): ResultatCommande {
  if (args[0] === '-c' || args[0] === '-b') {
    const nom = args[1] ?? '';
    if (nom in depot.branches) {
      return {
        ...ok(depot),
        erreur: erreur('branche-existe', [`fatal: a branch named '${nom}' already exists`], nom),
      };
    }
    const cree = creerBranche(depot, nom, idHead(depot));
    const bascule = basculer(cree.depot, nom);
    if (bascule.erreur) return bascule;
    return {
      depot: bascule.depot,
      sortie: [`Switched to a new branch '${nom}'`],
      evenements: [...cree.evenements, ...bascule.evenements],
    };
  }
  return basculer(depot, args[0] ?? '');
}

/** git checkout <branche> | <ref> | -b <nouvelle> | <fichier> */
export function extraire(depot: Depot, args: string[]): ResultatCommande {
  if (args[0] === '-b') return changer(depot, ['-c', args[1] ?? '']);
  const cible = args[0] ?? '';
  if (cible in depot.branches) return basculer(depot, cible);

  const arbre = arbreHead(depot);
  if (cible in arbre || cible in depot.index) {
    const travail = { ...depot.travail };
    delete travail[cible];
    const index = { ...depot.index };
    delete index[cible];
    return ok({ ...depot, travail, index });
  }

  const commitCible = resoudre(depot, cible);
  if (commitCible === null) {
    return {
      ...ok(depot),
      erreur: erreur(
        'pathspec',
        [`error: pathspec '${cible}' did not match any file(s) known to git`],
        cible,
      ),
    };
  }
  const bloquants = conflitChangement(depot, depot.commits[commitCible]?.arbre ?? {});
  if (bloquants.length > 0) return refuserEcrasement(depot, bloquants);

  const de = idHead(depot);
  const c = depot.commits[commitCible];
  const sortie = [
    `Note: switching to '${cible}'.`,
    '',
    "You are in 'detached HEAD' state. You can look around, make experimental",
    'changes and commit them, and you can discard any commits you make in this',
    'state without impacting any branches by switching back to a branch.',
    '',
    'If you want to create a new branch to retain commits you create, you may',
    'do so (now or later) by using -c with the switch command. Example:',
    '',
    '  git switch -c <new-branch-name>',
    '',
    'Or undo this operation with:',
    '',
    '  git switch -',
    '',
    'Turn off this advice by setting config variable advice.detachedHead to false',
    '',
    `HEAD is now at ${commitCible} ${c?.message ?? ''}`,
  ];
  const suivant = normaliser({ ...depot, head: { type: 'commit', id: commitCible } });
  return {
    depot: suivant,
    sortie,
    evenements: de === commitCible ? [] : [{ type: 'headDeplace', de, vers: commitCible }],
  };
}
