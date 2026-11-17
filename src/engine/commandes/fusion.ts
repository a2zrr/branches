import { ancestres, arbreHead, baseFusion, idHead, normaliser } from '../depot';
import {
  contenuAvecMarqueurs,
  fichiersModifies,
  fusionTexte,
  modesFichiers,
  resume,
  statsFichier,
} from '../diff';
import { erreur } from '../erreurs';
import type { Arbre, Choix, Contenu, Depot, Evenement, ResultatCommande, Segment } from '../types';
import { creerCommit, ok } from './commun';

const memeContenu = (a: Contenu | undefined, b: Contenu | undefined): boolean =>
  a === undefined || b === undefined ? a === b : a.length === b.length && a.every((l, i) => l === b[i]);

/** git merge <branche> | git merge --abort */
export function fusionner(depot: Depot, args: string[]): ResultatCommande {
  if (args[0] === '--abort') {
    if (depot.fusion === null) {
      return {
        ...ok(depot),
        erreur: erreur('pas-de-fusion', ['fatal: There is no merge to abort (MERGE_HEAD missing).']),
      };
    }
    return ok({ ...depot, fusion: null, travail: {}, index: {} });
  }

  const nom = args[0] ?? '';
  const autreId = depot.branches[nom];
  if (autreId === undefined) {
    return {
      ...ok(depot),
      erreur: erreur('merge-inconnu', [`merge: ${nom} - not something we can merge`], nom),
    };
  }
  const headId = idHead(depot);
  if (ancestres(depot.commits, headId).has(autreId)) {
    return ok(depot, ['Already up to date.']);
  }

  if (ancestres(depot.commits, autreId).has(headId)) {
    return avance(depot, headId, autreId, nom);
  }

  const base = baseFusion(depot, headId, autreId);
  const arbreBase: Arbre = base !== null ? (depot.commits[base]?.arbre ?? {}) : {};
  const ours = arbreHead(depot);
  const theirs = depot.commits[autreId]?.arbre ?? {};
  const chemins = [
    ...new Set([...Object.keys(ours), ...Object.keys(theirs), ...Object.keys(arbreBase)]),
  ].sort();

  const resultat: Record<string, Contenu> = {};
  const supprimes = new Set<string>();
  const conflits: Record<string, readonly Segment[]> = {};

  for (const p of chemins) {
    const o = ours[p];
    const t = theirs[p];
    const b = arbreBase[p];
    let final: Contenu | undefined;
    if (memeContenu(o, t)) final = o;
    else if (memeContenu(o, b)) final = t;
    else if (memeContenu(t, b)) final = o;
    else {
      if (o === undefined || t === undefined) {
        conflits[p] = [{ conflit: { ours: o ?? [], theirs: t ?? [] } }];
      } else {
        const r = fusionTexte(o, b, t);
        if (r.conflit) conflits[p] = r.segments;
        else final = r.segments.flatMap((s) => ('ok' in s ? [...s.ok] : []));
      }
      if (conflits[p] !== undefined) continue;
    }
    if (final === undefined) supprimes.add(p);
    else resultat[p] = final;
  }

  if (Object.keys(conflits).length === 0) {
    const arbreFusion: Record<string, Contenu> = { ...resultat };
    for (const p of supprimes) delete arbreFusion[p];
    const cree = creerCommit(depot, {
      message: `Merge branch '${nom}'`,
      parents: [headId, autreId],
      arbre: arbreFusion,
    });
    const fichiers = fichiersModifies(ours, arbreFusion);
    const sortie = [
      "Merge made by the 'ort' strategy.",
      ...fichiers.map(statsFichier),
      resume(fichiers),
      ...modesFichiers(fichiers),
    ];
    return {
      depot: { ...cree.depot, fusion: null },
      sortie,
      evenements: [
        ...cree.evenements,
        {
          type: 'fusion',
          branche: depot.head.type === 'branche' ? depot.head.nom : 'HEAD',
          avec: nom,
          rapide: false,
        },
      ],
    };
  }

  // Conflits : les fichiers propres sont indexés, les fichiers en conflit reçoivent les marqueurs dans l'espace de travail.
  let suivant: Depot = { ...depot, index: {}, travail: {} };
  const index: Record<string, Contenu | null> = {};
  for (const [p, contenu] of Object.entries(resultat)) {
    if (!memeContenu(ours[p], contenu)) index[p] = contenu;
  }
  for (const p of supprimes) {
    if (ours[p] !== undefined) index[p] = null;
  }
  const travail: Record<string, Contenu | null> = {};
  const evenements: Evenement[] = [];
  const sortie: string[] = [];
  for (const [p, segments] of Object.entries(conflits)) {
    travail[p] = contenuAvecMarqueurs(segments, nom);
    sortie.push(`Auto-merging ${p}`, `CONFLICT (content): Merge conflict in ${p}`);
    evenements.push({ type: 'conflit', fichier: p });
  }
  sortie.push('Automatic merge failed; fix conflicts and then commit the result.');
  const cible = depot.head.type === 'branche' ? depot.head.nom : 'HEAD';
  suivant = normaliser({
    ...suivant,
    index,
    travail,
    fusion: { cible, avec: nom, autreId, fichiers: conflits },
  });
  return { depot: suivant, sortie, evenements };
}

function avance(depot: Depot, headId: string, autreId: string, nom: string): ResultatCommande {
  const avant = depot.commits[headId]?.arbre ?? {};
  const apres = depot.commits[autreId]?.arbre ?? {};
  const fichiers = fichiersModifies(avant, apres);
  const sortie = [
    `Updating ${headId}..${autreId}`,
    'Fast-forward',
    ...fichiers.map(statsFichier),
    resume(fichiers),
    ...modesFichiers(fichiers),
  ];
  const suivant = normaliser(
    depot.head.type === 'branche'
      ? { ...depot, branches: { ...depot.branches, [depot.head.nom]: autreId } }
      : { ...depot, head: { type: 'commit', id: autreId } },
  );
  return {
    depot: suivant,
    sortie,
    evenements: [
      {
        type: 'fusion',
        branche: depot.head.type === 'branche' ? depot.head.nom : 'HEAD',
        avec: nom,
        rapide: true,
      },
      { type: 'headDeplace', de: headId, vers: autreId },
    ],
  };
}

/**
 * Résout un fichier en conflit : un choix par bloc (mienne, autre, deux).
 * Le contenu résolu est indexé et retiré de l'espace de travail.
 */
export function resoudreFichier(depot: Depot, fichier: string, choix: readonly Choix[]): Depot {
  const segments = depot.fusion?.fichiers[fichier];
  if (depot.fusion === null || segments === undefined) return depot;
  let k = 0;
  const contenu = segments.flatMap((s): string[] => {
    if ('ok' in s) return [...s.ok];
    const c = choix[k] ?? 'mienne';
    k += 1;
    if (c === 'mienne') return [...s.conflit.ours];
    if (c === 'autre') return [...s.conflit.theirs];
    return [...s.conflit.ours, ...s.conflit.theirs];
  });
  const travail = { ...depot.travail };
  delete travail[fichier];
  return { ...depot, travail, index: { ...depot.index, [fichier]: contenu } };
}

/** Le fichier contient-il encore des marqueurs de conflit dans l'espace de travail ? */
export function marqueursRestants(depot: Depot): boolean {
  return Object.values(depot.travail).some(
    (c) => c?.some((l) => /^(<<<<<<< |=======$|>>>>>>> )/.test(l)) ?? false,
  );
}
