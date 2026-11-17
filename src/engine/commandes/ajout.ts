import { arbreHead, idHead, normaliser } from '../depot';
import type { Depot, ResultatCommande } from '../types';
import { erreur } from '../erreurs';
import { arbreIndex, creerCommit, ok, resumeCommit } from './commun';
import { fichiersModifies } from '../diff';
import { statut } from './statut';

/** git add <fichier> | . | -A */
export function ajouter(depot: Depot, args: string[]): ResultatCommande {
  if (args.length === 0) {
    return { ...ok(depot), erreur: erreur('arguments', ['Nothing specified, nothing added.'], 'git add') };
  }
  let suivant = depot;
  const arbre = arbreHead(depot);
  for (const arg of args) {
    if (arg === '.' || arg === '-A' || arg === '--all') {
      for (const chemin of Object.keys(suivant.travail)) {
        suivant = prendreEnCharge(suivant, chemin);
      }
      continue;
    }
    if (arg in suivant.travail) {
      suivant = prendreEnCharge(suivant, arg);
      continue;
    }
    if (arg in arbre || arg in suivant.index) continue;
    return {
      ...ok(depot),
      erreur: erreur('pathspec', [`fatal: pathspec '${arg}' did not match any files`], arg),
    };
  }
  return ok(normaliser(suivant));
}

function prendreEnCharge(depot: Depot, chemin: string): Depot {
  const contenu = depot.travail[chemin] ?? null;
  const index = { ...depot.index, [chemin]: contenu };
  const travail = { ...depot.travail };
  delete travail[chemin];
  return { ...depot, index, travail };
}

/** git commit [-a] [-m "message"] [--allow-empty] */
export function commit(depot: Depot, args: string[]): ResultatCommande {
  let tout = false;
  let vide = false;
  let message: string | null = null;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? '';
    if (a === '--allow-empty') {
      vide = true;
    } else if (a.startsWith('-') && !a.startsWith('--')) {
      if (a.includes('a')) tout = true;
      if (a.includes('m')) {
        const valeur = args[i + 1];
        if (valeur === undefined) {
          return {
            ...ok(depot),
            erreur: erreur('arguments', ["error: switch `m' requires a value"], 'message'),
          };
        }
        message = valeur;
        i += 1;
      }
    } else {
      return { ...ok(depot), erreur: erreur('arguments', [`error: unknown option \`${a}'`], a) };
    }
  }

  if (depot.fusion !== null) {
    const nonResolus = Object.keys(depot.fusion.fichiers).filter((f) => !(f in depot.index));
    if (nonResolus.length > 0) {
      return {
        ...ok(depot),
        erreur: erreur('conflits-non-resolus', [
          'error: Committing is not possible because you have unmerged files.',
          'fatal: Exiting because of an unresolved conflict.',
        ]),
      };
    }
  }

  let prepare = depot;
  if (tout) {
    const arbre = arbreHead(depot);
    for (const chemin of Object.keys(prepare.travail)) {
      if (chemin in arbre || chemin in prepare.index) {
        const contenu = prepare.travail[chemin] ?? null;
        const travail = { ...prepare.travail };
        delete travail[chemin];
        prepare = { ...prepare, travail, index: { ...prepare.index, [chemin]: contenu } };
      }
    }
    prepare = normaliser(prepare);
  }

  const nouvelArbre = arbreIndex(prepare);
  const avant = arbreHead(prepare);
  const modifie = fichiersModifies(avant, nouvelArbre).length > 0;
  if (!modifie && !vide && prepare.fusion === null) {
    const texte = statut(prepare).sortie.slice(-1);
    return { ...ok(depot), erreur: erreur('rien-a-valider', texte, '') };
  }

  const fusion = prepare.fusion;
  const finalMessage = message ?? (fusion !== null ? `Merge branch '${fusion.avec}'` : null);
  if (finalMessage === null) {
    return {
      ...ok(depot),
      erreur: erreur('arguments', ['Aborting commit due to empty commit message.'], 'message'),
    };
  }

  const parents = [idHead(prepare), ...(fusion !== null ? [fusion.autreId] : [])];
  const cree = creerCommit(prepare, { message: finalMessage, parents, arbre: nouvelArbre });
  const sortie = resumeCommit(prepare, cree.commit, avant);
  const depotFinal: Depot = { ...cree.depot, fusion: null };
  const evenements = [...cree.evenements];
  if (fusion !== null) {
    evenements.push({ type: 'fusion', branche: fusion.cible, avec: fusion.avec, rapide: false });
  }
  const sortieFinale = fusion !== null ? [sortie[0] ?? ''] : sortie;
  return { depot: depotFinal, sortie: sortieFinale, evenements };
}
