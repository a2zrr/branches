import { ancestres, idHead, resoudre as resoudreRef } from '../depot';
import type { Depot, ResultatCommande } from '../types';
import { erreur } from '../erreurs';
import { ok } from './commun';
import { fichiersModifies, resume, modesFichiers, statsFichier } from '../diff';

/** Décorations d'un commit : HEAD -> branche, autres branches, tags. */
function decorations(depot: Depot, id: string): string {
  const parties: string[] = [];
  const headId = idHead(depot);
  const brancheHeadNom = depot.head.type === 'branche' ? depot.head.nom : null;
  const branchesSur = depot.ordreBranches.filter((b) => depot.branches[b] === id);
  if (headId === id) {
    if (brancheHeadNom !== null) {
      parties.push(`HEAD -> ${brancheHeadNom}`);
      for (const b of branchesSur) if (b !== brancheHeadNom) parties.push(b);
    } else {
      parties.push('HEAD');
      for (const b of branchesSur) parties.push(b);
    }
  } else {
    for (const b of branchesSur) parties.push(b);
  }
  for (const [nom, cible] of Object.entries(depot.tags)) {
    if (cible === id) parties.push(`tag: ${nom}`);
  }
  return parties.length > 0 ? ` (${parties.join(', ')})` : '';
}

/** Commits joignables depuis HEAD, du plus récent au plus ancien. */
function historique(depot: Depot): string[] {
  const ids = [...ancestres(depot.commits, idHead(depot))];
  return ids.sort((a, b) => (depot.commits[b]?.seq ?? 0) - (depot.commits[a]?.seq ?? 0));
}

/** git log [--oneline] [-n N] */
export function log(depot: Depot, args: string[]): ResultatCommande {
  const oneline = args.includes('--oneline');
  let limite = Infinity;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? '';
    if (a === '-n') limite = parseInt(args[i + 1] ?? '', 10);
    else if (/^-\d+$/.test(a)) limite = parseInt(a.slice(1), 10);
  }
  const ids = historique(depot).slice(0, Number.isFinite(limite) ? limite : undefined);
  const sortie: string[] = [];
  for (const id of ids) {
    const c = depot.commits[id];
    if (c === undefined) continue;
    if (oneline) {
      sortie.push(`${id}${decorations(depot, id)} ${c.message}`);
    } else {
      sortie.push(`commit ${id}${decorations(depot, id)}`, `Author: ${c.auteur}`, '', `    ${c.message}`, '');
    }
  }
  return ok(depot, sortie);
}

/** git show <ref> : résumé du commit et de ses modifications. */
export function montrer(depot: Depot, args: string[]): ResultatCommande {
  const ref = args[0] ?? 'HEAD';
  const cible = resoudreRef(depot, ref);
  if (cible === null) {
    return { ...ok(depot), erreur: erreur('revision-invalide', [`fatal: bad revision '${ref}'`], ref) };
  }
  const c = depot.commits[cible];
  if (c === undefined) return ok(depot);
  const parent = c.parents[0];
  const avant = parent !== undefined ? (depot.commits[parent]?.arbre ?? {}) : {};
  const fichiers = fichiersModifies(avant, c.arbre);
  const sortie = [`commit ${cible}`, `Author: ${c.auteur}`, '', `    ${c.message}`, ''];
  if (fichiers.length > 0) {
    sortie.push(...fichiers.map(statsFichier), resume(fichiers), ...modesFichiers(fichiers));
  }
  return ok(depot, sortie);
}

/** git help : aide courte (non comptée). */
export function aide(depot: Depot): ResultatCommande {
  return ok(depot, [
    'usage: git [-v | --version] [-h | --help] <command> [<args>]',
    '',
    'Commandes courantes :',
    "   add      ajoute le contenu d'un fichier à l'index",
    '   bisect   trouve le commit qui a introduit un bogue',
    '   branch   liste, crée ou supprime des branches',
    '   checkout change de branche ou restaure des fichiers',
    '   commit   enregistre les modifications dans le dépôt',
    "   log      affiche l'historique des commits",
    '   merge    fusionne une branche dans la branche courante',
    '   reset    remet HEAD à un commit précédent',
    '   revert   annule un commit par un nouveau commit',
    '   show     affiche un commit',
    "   status   affiche l'état de l'espace de travail",
    '   switch   change de branche',
    '   tag      crée, liste ou supprime des tags',
  ]);
}
