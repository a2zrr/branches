import { idHead, normaliser, resoudre } from '../depot';
import { erreur } from '../erreurs';
import type { Contenu, Depot, Evenement, ResultatCommande } from '../types';
import { ok } from './commun';

/** git reset [--soft | --mixed | --hard] <ref> */
export function remettre(depot: Depot, args: string[]): ResultatCommande {
  const mode = args.find((a) => a.startsWith('--')) ?? '--mixed';
  if (!['--soft', '--mixed', '--hard'].includes(mode)) {
    return { ...ok(depot), erreur: erreur('arguments', [`error: unknown option \`${mode.slice(2)}'`], mode) };
  }
  const ref = args.filter((a) => !a.startsWith('--'))[0] ?? 'HEAD';
  const cible = resoudre(depot, ref);
  if (cible === null || depot.commits[cible] === undefined) {
    return {
      ...ok(depot),
      erreur: erreur('revision-invalide', [`fatal: ambiguous argument '${ref}': unknown revision`], ref),
    };
  }
  const de = idHead(depot);
  let suivant: Depot =
    depot.head.type === 'branche'
      ? { ...depot, branches: { ...depot.branches, [depot.head.nom]: cible } }
      : { ...depot, head: { type: 'commit', id: cible } };

  if (mode === '--mixed' || mode === '--hard') {
    const travail: Record<string, Contenu | null> = { ...depot.travail };
    if (mode === '--mixed') {
      for (const [chemin, contenu] of Object.entries(depot.index)) {
        if (!(chemin in travail)) travail[chemin] = contenu ?? null;
      }
    } else {
      for (const k of Object.keys(travail)) delete travail[k];
    }
    suivant = { ...suivant, travail, index: {} };
  }
  suivant = normaliser(suivant);

  const evenements: Evenement[] = de === cible ? [] : [{ type: 'headDeplace', de, vers: cible }];
  const sortie: string[] = [];
  if (mode !== '--soft') {
    const c = depot.commits[cible];
    sortie.push(`HEAD is now at ${cible} ${c.message}`);
  }
  return { depot: suivant, sortie, evenements };
}
